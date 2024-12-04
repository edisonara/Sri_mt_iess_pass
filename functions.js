

    const API_URL = 'http://localhost:3000';
// Función para manejar el login  de la plataforma del sri ecuador
async function handleSriLogin(e) {
    const id_registro = e.target.dataset.id;

    try {
        console.log(`Obteniendo datos para el id_registro: ${id_registro}`);
        const response = await fetch(`${API_URL}/api/sri_login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_registro })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al obtener los datos para el login del SRI');
        }

        const data = await response.json();
        if (!data.success || !data.data) {
            throw new Error('Respuesta no válida del servidor. No se encontraron los datos necesarios para el login del SRI.');
        }

        const loginData = data.data;
        console.log('Datos específicos para el login:', loginData);

        const initialSriUrl = "https://srienlinea.sri.gob.ec/sri-en-linea/contribuyente/perfil";
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            const activeTab = tabs[0];

            chrome.tabs.update(activeTab.id, { url: initialSriUrl }, () => {
                chrome.tabs.onUpdated.addListener(function listener(tabIdUpdated, info) {
                    if (tabIdUpdated === activeTab.id && info.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        console.log('La página de perfil del SRI se ha cargado correctamente.');
                        console.log('ID de la página activa:', activeTab.id);
                        console.log('Identificador del registro:', id_registro);

                        setTimeout(() => {
                            waitForLogoutButtonAndPerformActions(activeTab.id, loginData, id_registro);
                        }, 1000); 
                        console.log('Esperando a que aparezca el botón de cerrar sesión...');
                        // Llamar a la función de extracción de fechas después de un tiempo de espera adicional
                        //setTimeout(() => extractObligationDates(id_registro), 3000);

                        
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al intentar iniciar sesión en el SRI (cliente)', 'error');
    }
}


// Función para esperar la aparición del botón "Cerrar sesión"
function waitForLogoutButtonAndPerformActions(tabId, loginData, id_registro) {
    const maxRetries = 5; 
    const intervalTime = 1000;
    let attempts = 0;

    const interval = setInterval(() => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => !!document.querySelector('li > a[aria-label="Cerrar sesión"]')
        }, (results) => {
            const isLogoutButtonPresent = results[0]?.result;

            if (isLogoutButtonPresent) {
                clearInterval(interval);
                console.log('Botón "Cerrar sesión" detectado. Procediendo a cerrar sesión...');

                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: () => {
                        const logoutButton = document.querySelector('li > a[aria-label="Cerrar sesión"]');
                        if (logoutButton) logoutButton.click();
                    },
                }, () => {
                    setTimeout(() => {
                        console.log('Sesión cerrada. Continuando con el proceso de login...');
                        initiateSriLogin(tabId, loginData, id_registro);
                    }, 1000);
                });
            } else if (attempts >= maxRetries) {
                clearInterval(interval);
                console.log('Botón "Cerrar sesión" no encontrado después de varios intentos. Continuando con el proceso de login...');
                initiateSriLogin(tabId, loginData, id_registro);
            }
            attempts++;
        });
    }, intervalTime);
}

    

// Función para iniciar el login en el SRI
function initiateSriLogin(tabId, loginData, id_registro) {
    const sriUrl = "https://srienlinea.sri.gob.ec/auth/realms/Internet/protocol/openid-connect/auth?client_id=app-sri-claves-angular&redirect_uri=https%3A%2F%2Fsrienlinea.sri.gob.ec%2Fsri-en-linea%2F%2Fcontribuyente%2Fperfil&state=1234&nonce=5678&response_mode=fragment&response_type=code&scope=openid";

    chrome.tabs.update(tabId, { url: sriUrl }, () => {
        chrome.tabs.onUpdated.addListener(function listener(tabIdUpdated, info) {
            if (tabIdUpdated === tabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                console.log('La página del SRI se ha cargado correctamente.');
                console.log('Datos específicos para el login:', id_registro);
                console.log('Edison ya pasamos los datos... ');
                console.log('Datos específicos para el login:', loginData.username);

                try {
                    // Inyectar el script para realizar el login con los datos específicos
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: sendLoginMessage,
                        args: [loginData, id_registro]
                    });

                } catch (error) {
                    console.error('Error de inyección de script:', error);
                    showMessage('Error al inyectar el script para realizar el login', 'error');
                }
            }
        });
    });
}



// Manejar el cambio de estado del checkbox de obligaciones
async function handleObligacionesToggle(event) {
    const id = event.target.dataset.id; 
    const newState = event.target.checked; 
    const token = localStorage.getItem('token'); // Obtén el token desde el almacenamiento (si está guardado)

    try {
        const response = await fetch(`http://localhost:3000/api/user/${id}/toggle_obligaciones`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Incluye el token en el encabezado
            },
            body: JSON.stringify({ obligaciones_pendientes: newState })
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el estado de obligaciones pendientes');
        }

        console.log('Obligaciones pendientes actualizadas exitosamente');
    } catch (error) {
        console.error('Error al actualizar obligaciones:', error);
    }
}



