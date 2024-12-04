// contentScript.js

// Escucha los mensajes desde el popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Mensaje recibido:', message);
    if (message.action === "performLogin") {
        performLogin(message.loginData, message.id_registro);
        sendResponse({ status: "loginStarted" });
    }
});

// Función de login y extracción de datos
async function performLogin(loginData, id_registro) {
    function waitForElement(select6or) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) return resolve(document.querySelector(selector));
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    try {
        // Paso 1: Realizar el login
        const userInput = await waitForElement('input[name="usuario"]');
        const passInput = await waitForElement('input[name="password"]');
        const ciInput = await waitForElement('input[name="ciAdicional"]');
        const loginButton = await waitForElement('input[type="submit"]');

        if (!userInput || !passInput || !loginButton) {
            console.error('No se encontraron todos los elementos del formulario.');
            return;
        }

        userInput.value = loginData.cedula;
        passInput.value = loginData.password;
        if (loginData.ciAdicional && ciInput) {
            ciInput.value = loginData.ciAdicional;
        }

        [userInput, passInput, ciInput].forEach(el => el?.dispatchEvent(new Event('input', { bubbles: true })));
        loginButton.click();

        // Paso 2: Extraer fechas de obligaciones (espera a que cargue el contenido)
        await waitForElement('.mat-expansion-panel-content');

        // Paso 3: Escanear y verificar obligaciones pendientes
        let tieneObligacionesPendientes = false;
        const listaElementos = document.querySelectorAll('.mat-expansion-panel-content ul li');

        listaElementos.forEach(element => {
            const texto = element.textContent;
            const regexFecha = /\d{2}\/\d{2}\/\d{4}/;
            const fechaEncontrada = texto.match(regexFecha);

            if (fechaEncontrada) {
                const [dia, mes, anio] = fechaEncontrada[0].split('/').map(Number);
                const fechaVencimiento = new Date(anio, mes - 1, dia);
                const hoy = new Date();

                if (fechaVencimiento < hoy) {
                    tieneObligacionesPendientes = true;
                }
            }
        });

        console.log("¿Tiene obligaciones pendientes?:", tieneObligacionesPendientes);

        // Paso 4: Enviar el estado de obligaciones a la API
        if (tieneObligacionesPendientes) {
            try {
                const response = await fetch(`http://localhost:3000/api/user/${id_registro}/actualizar_obligaciones`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ diaVencimiento: new Date().getDate() })
                });

                if (response.ok) {
                    console.log('Obligaciones pendientes actualizadas en la base de datos.');
                } else {
                    console.error('Error en la actualización: ', response.statusText);
                }
            } catch (error) {
                console.error('Error al actualizar obligaciones:', error);
            }
        } else {
            console.log('No hay obligaciones pendientes vencidas.');
        }

    } catch (error) {
        console.error('Error en el proceso de login o extracción de obligaciones:', error);
    }
}
