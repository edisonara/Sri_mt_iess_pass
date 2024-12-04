

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const dashboard = document.getElementById('dashboard');
    const dataForm = document.getElementById('dataForm');
    const editForm = document.getElementById('editForm');
    const message = document.getElementById('message');
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    const apiForm = document.getElementById('apiForm');
    const userDataTable = document.getElementById('userDataTable');
    const welcomeUser = document.getElementById('welcomeUser');
    const logout = document.getElementById('logout');
    const showRegister = document.getElementById('showRegister');
    const cancelEdit = document.getElementById('cancelEdit');
    const showLogin = document.getElementById('showLogin');
    const showDataForm = document.getElementById('showDataForm');
    const showDashboard = document.getElementById('showDashboard');
    const institucionTipo = document.getElementById('institucionTipo');
    const ciAdicional = document.getElementById('ciAdicional');
    const resetPasswordButton = document.getElementById('resetPasswordButton');
    const resetPasswordForm = document.getElementById('resetPasswordForm');

    const API_URL = 'http://localhost:3000'; // Ruta a la API

    document.getElementById('institucionSelect').addEventListener('change', function () {
        const ciAdicional = document.getElementById('ciAdicional');
        
        // Si se selecciona "SRI", mostrar el campo "C.I. Adicional"
        if (this.value === 'SRI') {
            ciAdicional.style.display = 'block';  // Mostrar el campo
        } else {
            ciAdicional.style.display = 'none';  // Ocultar el campo
        }
    });
    // Mostrar/ocultar el campo CI Adicional según la institución seleccionada
    document.getElementById('editInstitucionSelect').addEventListener('change', function () {
        const ciAdicionalContainer = document.getElementById('ciAdicionalContainer');
        
        if (this.value === 'SRI') {
            ciAdicionalContainer.style.display = 'block'; // Mostrar
        } else {
            ciAdicionalContainer.style.display = 'none'; // Ocultar
            //document.getElementById('editCiAdicional').value = ''; // Limpiar el campo
        }
    });


    // Función para validar el token
    async function validateToken(token) {
        try {
            const response = await fetch('http://localhost:3000/validate-token', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Token inválido o expirado.');
            }
        } catch (error) {
            console.error('Error validando el token:', error);
            throw error;
        }
    }

    // Función para extraer el username del token
    function extractUsernameFromToken(token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.username;
    }

    // Funciones de manejo del token en chrome.storage
    function saveToken(token) {
        chrome.storage.local.set({ token }, () => {
            console.log('Token guardado en chrome.storage');
        });
    }

    function getToken(callback) {
        chrome.storage.local.get('token', (result) => {
            if (result.token) {
                callback(result.token);
            } else {
                console.log('No se encontró token');
                showSection(loginForm);
            }
        });
    }

    function clearToken() {
        chrome.storage.local.remove('token', () => {
            console.log('Token eliminado de chrome.storage');
            showSection(loginForm);
        });
    }

    
    getToken((token) => {
        if (token) {
            validateToken(token)
                .then(() => {
                    fetchUserData(token); // Llamar a tu función que usa el token
                    welcomeUser.textContent = extractUsernameFromToken(token); // Mostrar usuario
                    showSection(dashboard); // Mostrar el dashboard directamente
                })
                .catch(() => {
                    clearToken();
                    showSection(loginForm); // Si el token no es válido, mostrar el formulario de login
                });
        } else {
            showSection(loginForm);
        }
    });


    // verificar coneccion con el servidor y mandar un mensaje de bienvenida y verificacion con la api
    fetch(`${API_URL}`)
    .then(response => {
        if (response.headers.get("content-type").includes("application/json")) {
            return response.json();
        } else {
            throw new Error("La respuesta no es un JSON válido.");
        }
    })
    .then(data => {
        console.log(data.message);
        showMessage(data.message, 'success');
    })
    .catch(error => {
        console.error('Error al conectarse al servidor:', error);
        showMessage('Error al conectarse al servidor.', 'error');
    });


    // Muestra u oculta secciones
    function showSection(section) {
        [loginForm, registerForm, dashboard, dataForm, editForm, resetPasswordForm].forEach(s => s.classList.remove('active'));
        section.classList.add('active');
    }

    
    function showMessage(text, type) {
        const message = document.getElementById('message');
        
        message.textContent = text; 
        message.className = `message ${type}`; 
    
        
        message.style.display = 'block';
    
        
        setTimeout(() => {
            message.style.display = 'none'; 
            message.className = 'message';  
        }, 3000);
    }
    


     getToken((token) => {
         if (token) {
             fetchUserData(token); // Llamar a tu función que usa el token
         }
     });
    
    

    // Filtro dinámico
document.getElementById('searchInput').addEventListener('input', function () {
    const filterText = this.value.toLowerCase(); // Texto de filtro
    const storedData = JSON.parse(localStorage.getItem('userData')) || []; // Obtener datos del almacenamiento local

    // Filtrar datos por nombre
    const filteredData = storedData.filter(item =>
        item.nombre.toLowerCase().includes(filterText)
    );
    
    updateUserDataTable(filteredData); // Mostrar los datos filtrados
    showMessage(`Resultados encontrados: ${filteredData.length}`, 'success');
});



    async function cargarInstituciones() {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/instituciones`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            if (response.ok) {
                const instituciones = await response.json();
                const select = document.getElementById('editInstitucionSelect');
    
                // Limpiar las opciones existentes
                select.innerHTML = '<option value="">Selecciona una institución</option>';
    
                // Añadir opciones desde los datos del servidor
                instituciones.forEach((institucion) => {
                    const option = document.createElement('option');
                    option.value = institucion.codigo;
                    option.textContent = institucion.nombre;
                    select.appendChild(option);
                });
            } else {
                showMessage('Error al cargar las instituciones', 'error');
            }
        } catch (error) {
            console.error('Error al cargar instituciones:', error);
            showMessage('Error en la conexión con el servidor', 'error');
        }
    }
    
    // Actualiza la tabla con los datos del usuario


    // Función para editar un registro
    async function handleEdit(e) {
        // Verificar si el valor de dataset.record es válido
        const recordData = e.target.dataset.record;
        console.log('Record Data:', recordData); // Añadir un log para verificar el valor de dataset.record
    
        if (!recordData) {
            console.error('No se encontró un registro para editar');
            showMessage('No se encontró un registro', 'error');
            return;
        }
    
        let record;
        try {
            // Intentar parsear el valor
            record = JSON.parse(recordData);
        } catch (error) {
            console.error('Error al parsear el JSON:', error);
            return;
        }
        
        currentEditingId = record.id;
        
        // Cargar las instituciones antes de llenar el formulario
        await cargarInstituciones();
    
        // Rellenar los campos con los datos del registro
        document.getElementById('editNombre').value = record.nombre || '';
        document.getElementById('editCedula').value = record.cedula || '';
        document.getElementById('editInstitucionSelect').value = record.institucionTipo || '';
    
        // Configurar visibilidad del campo C.I. Adicional
        const ciAdicionalContainer = document.getElementById('ciAdicionalContainer');
        if (record.institucionTipo === 'SRI') {
            ciAdicionalContainer.style.display = 'block';
            document.getElementById('editCiAdicional').value = record.ciAdicional || '';
        } else {
            ciAdicionalContainer.style.display = 'none';
            document.getElementById('editCiAdicional').value = '';
        }
    
        showSection(editForm);
        showMessage('Registro editado exitosamente', 'success');
    }
   

    let currentEditingId = null;

// Manejar clic en botones de edición
document.querySelectorAll('.edit-button').forEach(button => {
    button.addEventListener('click', function () {
        currentEditingId = this.dataset.id; // Asignar ID
        cargarDatosEnFormulario(currentEditingId); // Cargar datos
        showSection(editFormElement); // Mostrar formulario
    });
});


document.getElementById('editFormElement').addEventListener('submit', async function (e) { 
    e.preventDefault();

    console.log('currentEditingId:', currentEditingId);
    const token = localStorage.getItem('token');
    if (!currentEditingId) {
        showMessage('Error: No se ha seleccionado un registro para editar', 'error');
        console.error('Error: No se ha seleccionado un registro para editar');
        return;
    }

    // Obtén el valor de 'editInstitucionSelect' (esto debería ser el valor correcto del select)
    const institucionSelect = document.getElementById('editInstitucionSelect');
    const institucionTipo = institucionSelect.value;  // Esto debería ser el 'codigo' de la institución (value del select)

    console.log('Institucion seleccionada:', institucionTipo); // Agregar un log para verificar el valor

    const payload = {
        nombre: document.getElementById('editNombre').value,
        cedula: document.getElementById('editCedula').value,
        institucion_tipo_id: institucionTipo,  // El valor del select directamente
        ciAdicional: institucionTipo === 'SRI' 
            ? document.getElementById('editCiAdicional').value 
            : null, // Si es "SRI", enviar el valor, si no, null
        password: document.getElementById('editPassword').value || null // Si está vacío, enviar null
    };

    console.log('Payload:', payload); // Agregar un log para verificar el contenido del payload

    // Validaciones básicas de campos requeridos
    if (!payload.nombre || !payload.cedula || !payload.institucion_tipo_id) {
        showMessage('Por favor, completa todos los campos obligatorios.', 'error');
        console.error('Error: Campos obligatorios incompletos');
        return;
    }

    try {
        // Realiza la solicitud al backend
        const response = await fetch(`${API_URL}/api/update_data/${currentEditingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        // Manejo de la respuesta
        if (response.ok) {
            const responseData = await response.json();
            console.log('Datos actualizados:', responseData.data);
            fetchUserData(); // Recarga los datos visibles en la interfaz
            showSection(dashboard);
            showMessage('Registro actualizado exitosamente', 'success');
        } else {
            const errorData = await response.json();
            showMessage(errorData.message || 'Error al actualizar', 'error');
            console.error('Error al actualizar:', error);
        }
    } catch (error) {
        console.error('Error al actualizar:', error);
        showMessage('Error en la conexión con el servidor', 'error');
    }
});


    

    // Función para eliminar un registro
    async function handleDelete(e) {
        const id = e.target.dataset.id;
        const token = localStorage.getItem('token');

        if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
            try {
                const response = await fetch(`${API_URL}/api/delete_data/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    showMessage('Registro eliminado exitosamente', 'success');
                    fetchUserData(); // Actualiza la tabla después de eliminar
                } else {
                    const errorData = await response.json();
                    showMessage(errorData.message || 'Error al eliminar el registro', 'error');
                }
            } catch (error) {
                showMessage('Error en la conexión con el servidor', 'error');
                console.error('Error:', error);
            }
        }
    }

    async function fetchInstituciones() {
        try {
            const response = await fetch('/api/instituciones');
            const instituciones = await response.json();
            const institucionSelect = document.querySelector('#institucionTipo');
    
            instituciones.forEach(inst => {
                const option = document.createElement('option');
                option.value = inst.id;
                option.textContent = inst.nombre;
                institucionSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar instituciones:', error);
        }
    }
    
///________________________________________________________________
///____      TABLA DE DATOS


    // Obtener datos del usuario
    async function fetchUserData() {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('No se encontró token. Inicia sesión.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/user_data`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                updateUserDataTable(data);
                // Guardar los datos en el localStorage para uso posterior
                localStorage.setItem('userData', JSON.stringify(data));
            } else if (response.status === 403) {
                showMessage('Sesión expirada. Inicia sesión nuevamente.', 'error');
                localStorage.removeItem('token');
                showSection(loginForm);
            } else {
                showMessage('Error al obtener los datos del usuario.', 'error');
            }
        } catch (error) {
            console.error('Error al obtener los datos del usuario:', error);
            showMessage('Error en la conexión con el servidor.', 'error');
        }
    }


    function updateUserDataTable(data) {
        const tableBody = document.querySelector('#userDataTable tbody');
        tableBody.innerHTML = '';
    
        data.forEach(item => {
            const obligacionesChecked = item.obligaciones_pendientes ? 'checked' : '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.nombre}</td>
                <td>${item.cedula}</td>
                <td>${item.ciAdicional || '- - -'}</td>
                <td>
                    <button class="edit-btn" data-id="${item.id}" data-record='${JSON.stringify(item)}'>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${item.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
                <td>
                    <button class="bot-sri-btn" data-id="${item.id}" data-institution-type="${item.institucion_tipo_nombre}">
                        ${item.institucion_tipo_nombre || 'Sin institución'}
                    </button>
                    <!-- <input type="checkbox" class="obligaciones-checkbox" data-id="${item.id}" ${obligacionesChecked}> -->
                </td>
            `;
            tableBody.appendChild(row);
        });
    
        // Configurar eventos
        document.querySelectorAll('.edit-btn').forEach(button =>
            button.addEventListener('click', handleEdit)
        );
        document.querySelectorAll('.delete-btn').forEach(button =>
            button.addEventListener('click', handleDelete)
        );
    
        // Redirigir a la función correcta según el tipo de institución
        document.querySelectorAll('.bot-sri-btn').forEach(button =>
            button.addEventListener('click', function (e) {
                const id = e.target.dataset.id; // Obtener el ID del botón
                const institutionType = e.target.dataset.institutionType; // Obtener el tipo de institución
    
                // Redirigir a la función adecuada según el tipo de institución
                switch (institutionType) {
                    case 'SRI':
                        showMessage('Seleccionado SRI', 'info');
                        handleSriLogin(e); // Llamar a la función para SRI
                        break;
                    case 'IESS':
                        showMessage('Seleccionado IESS', 'info');
                        iniciarPortalIess(e); // Llamar a la función para IESS
                        break;
                    case 'MT':
                        showMessage('Seleccionado Contratos', 'info');
                        iniciarPortalContratos(e); // Llamar a la función para Contratos
                        
                        break;
                    default:
                        console.warn('Tipo de institución desconocido:', institutionType);
                        showMessage('Tipo de institución desconocido', 'error');
                        break;
                }
            })
        );
    
        document.querySelectorAll('.obligaciones-checkbox').forEach(checkbox =>
            checkbox.addEventListener('change', handleObligacionesToggle)
        );
    }
    

    // Manejar el inicio de sesión
    loginButton.addEventListener('click', async () => {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
    
        if (username && password) {
            try {
                const response = await fetch('http://localhost:3000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
    
                const data = await response.json();
                if (response.ok) {
                    const { token } = data;
                    saveToken(token);
                    localStorage.setItem('token', token);
                    welcomeUser.textContent = username;
                    showSection(dashboard);
                    fetchUserData(); // Obtener datos después de iniciar sesión
                    showMessage('Has iniciado sesión exitosamente.', 'success');
                    console.log('Token guardado:', token);
                } else {
                    showMessage(data.message || 'Error al iniciar sesión.', 'error');
                    console.log('Error al iniciar sesión:', data.message);
                }
            } catch (error) {
                showMessage('Error en la conexión con el servidor.', 'error');
                console.error('Error en la conexión con el servidor:', error);
            }
        } else {
            showMessage('Por favor, ingresa usuario y contraseña.', 'error');
            console.warn('Campos vacíos.');
        }
    });

    // Cierre de sesión
    logout.addEventListener('click', () => {
        localStorage.removeItem('token');
        clearToken();
        welcomeUser.textContent = ''; // Limpia el nombre del usuario mostrado
        showSection(loginForm); // Muestra el formulario de inicio de sesión
        showMessage('Has cerrado sesión exitosamente.', 'success');
        console.log('Sesión cerrada. Token eliminado.');
    });

    

    //Insertar usuarios
    registerButton.addEventListener('click', async () => {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerUsermail').value;
        const telefono = document.getElementById('registerUsertelefono').value;
        const cedula = document.getElementById('registerUsercedula').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConf = document.getElementById('registerPasswordConf').value;

        if (!username || !email || !telefono || !cedula || !password || !passwordConf) {
            showMessage('Por favor, completa todos los campos.', 'error');
            return;
        }

        if (password !== passwordConf) {
            showMessage('Las contraseñas no coinciden.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, telefono, cedula, password })
            });

            const data = await response.json();
            if (response.ok) {
                showMessage('Registro exitoso. Por favor, inicia sesión.', 'success');
                showSection(loginForm);
            } else {
                showMessage(data.message || 'Error al registrar el usuario.', 'error');
            }
        } catch (error) {
            showMessage('Error en la conexión con el servidor.', 'error');
        }
    });


    resetPasswordButton.addEventListener('click', async () => {
        const email = document.getElementById('resetUserEmail').value;
        const cedula = document.getElementById('resetUserCedula').value;
        const newPassword = document.getElementById('resetNewPassword').value;
    
        if (!email || !cedula || !newPassword) {
            showMessage('Por favor, completa todos los campos.', 'error');
            return;
        }
    
        try {
            const response = await fetch('http://localhost:3000/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, cedula, newPassword })
            });
    
            const data = await response.json();
            if (response.ok) {
                showMessage('Contraseña actualizada exitosamente. Por favor, inicia sesión.', 'success');
                showSection(loginForm);
            } else {
                showMessage(data.message || 'Error al actualizar la contraseña.', 'error');
            }
        } catch (error) {
            showMessage('Error en la conexión con el servidor.', 'error');
        }
    });
    


    
    // insertar datos
apiForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cedula = document.getElementById('cedula').value;
    const password = document.getElementById('password').value;
    const ciAdicional = document.getElementById('ciAdicional').value || null; // Campo opcional
    const institucionSelect = document.getElementById('institucionSelect').value;
    const nombre = document.getElementById('nombre').value;

    // Validar que los campos obligatorios estén llenos
    if (!cedula || !password || !institucionSelect || !nombre) {
        showMessage('Por favor, completa todos los campos obligatorios.', 'error');
        return;
    }

    const data = { 
        cedula, 
        password, 
        ciAdicional, 
        institucion_tipo_id: institucionSelect, 
        nombre 
    };

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/api/save_data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showMessage('Datos guardados con éxito', 'success');
            fetchUserData(); // Actualizar la tabla
            showSection(dashboard);
            showMessage('Datos guardados con éxito', 'success');
        } else {
            const errorData = await response.json();
            showMessage(errorData.message || 'Error al guardar los datos.', 'error');
        }
    } catch (error) {
        showMessage('Error en la conexión con el servidor.', 'error');
    }
});


//________________________________________________________________________________________________
// _____________        Sri ingresar


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
                        showMessage('Iniciando sesión en el SRI...', 'success');
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
                showMessage('Cerrar sesión no encontrado', 'error');
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
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: performLoginAndCheckObligations,
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



// Función principal que realiza login y extracción de datos
async function performLoginAndCheckObligations(loginData, id_registro) {
    function waitForElement(selector) {
        return new Promise(resolve => {
            const element = document.querySelector(selector);
            if (element) return resolve(element);
            
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
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

        // Disparar eventos para reflejar cambios
        [userInput, passInput, ciInput].forEach(el => el?.dispatchEvent(new Event('input', { bubbles: true })));
        loginButton.click();

        // Paso 2: Esperar a que cargue el contenido y extraer datos
        await waitForElement('.mat-expansion-panel-content');
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

        // Paso 3: Actualizar estado de obligaciones en el backend
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

// Exponer la función para que sea invocable desde `chrome.scripting.executeScript`
window.performLoginAndCheckObligations = performLoginAndCheckObligations;


///______________________________________------------------------------------------------------------------


async function iniciarPortalIess(e) {
    const id_registro = e.target.dataset.id;

    try {
        console.log(`Obteniendo datos para el id_registro (IESS): ${id_registro}`);
        const response = await fetch(`${API_URL}/api/sri_login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_registro })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al obtener los datos para el login del IESS');
        }

        const data = await response.json();
        const loginData = data.data;

        console.log('Datos específicos para el login en IESS:', loginData);

        const initialIessUrl = "https://www.iess.gob.ec/empleador-web/pages/principal.jsf"; // URL del portal IESS
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const activeTab = tabs[0];

            chrome.tabs.update(activeTab.id, { url: initialIessUrl }, () => {
                chrome.tabs.onUpdated.addListener(function listener(tabIdUpdated, info) {
                    if (tabIdUpdated === activeTab.id && info.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        console.log('Página inicial del IESS cargada.');

                        setTimeout(() => {
                            executeIessLogin(activeTab.id, loginData);
                        }, 1000);
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al intentar iniciar sesión en el IESS', 'error');
    }
}

function executeIessLogin(tabId, loginData) {
    chrome.scripting.executeScript({
        target: { tabId },
        func: (loginData) => {
            const usuarioField = document.querySelector('input[name="j_username"]');
            const passwordField = document.querySelector('input[name="j_password"]');
            const loginButton = document.querySelector('input[type="submit"]');

            if (usuarioField && passwordField && loginButton) {
                usuarioField.value = loginData.cedula;
                passwordField.value = loginData.password;
                loginButton.click();
            } else {
                console.log('No se encontraron los campos de login en IESS.');
            }
        },
        args: [loginData]
    });
}





//////////___________________________________________________________________



async function iniciarPortalContratos(e) {
    const id_registro = e.target.dataset.id;

    try {
        console.log(`Obteniendo datos para el id_registro (Contratos): ${id_registro}`);
        const response = await fetch(`${API_URL}/api/sri_login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_registro })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al obtener los datos para el login de Contratos');
        }

        const data = await response.json();
        const loginData = data.data;

        console.log('Datos específicos para el login en Contratos:', loginData);

        const initialContratosUrl = "https://sut.trabajo.gob.ec/mrl/loginContratos.xhtml"; // URL del portal Contratos
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const activeTab = tabs[0];

            chrome.tabs.update(activeTab.id, { url: initialContratosUrl }, () => {
                chrome.tabs.onUpdated.addListener(function listener(tabIdUpdated, info) {
                    if (tabIdUpdated === activeTab.id && info.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        console.log('Página inicial de Contratos cargada.');

                        setTimeout(() => {
                            executeContratosLogin(activeTab.id, loginData);
                        }, 1000);
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al intentar iniciar sesión en el portal de Contratos', 'error');
    }
}

function executeContratosLogin(tabId, loginData) {
    chrome.scripting.executeScript({
        target: { tabId },
        func: (loginData) => {
            const usuarioField = document.getElementById('loginForm:txtUser');
            const verifiButton = document.getElementById('loginForm:btnVerificar');

            if (usuarioField && verifiButton) {
                usuarioField.value = loginData.cedula;
                verifiButton.click();

                setTimeout(() => {
                    const passwordField = document.getElementById('loginForm:txtClv');
                    const loginButton = document.getElementById('loginForm:btnIngresar');
                
                    if (passwordField && loginButton) {
                        passwordField.value = loginData.password;
                        loginButton.click();
                    } else {
                        console.log('No se encontraron los campos de contraseña.');
                    }
                }, 1500); 
            } else {
                console.log('No se encontraron los campos de usuario en Contratos.');
            }
        },
        args: [loginData]
    });
}


////______________________________ OBLIGAICIONES PENDIENTES

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






//_____________________________________________________________________
// FILTRAR DATOS DE LA TABLA



    // Mostrar secciones correspondientes
    showRegister.addEventListener('click', () => showSection(registerForm));
    showLogin.addEventListener('click', () => showSection(loginForm));
    showDataForm.addEventListener('click', () => showSection(dataForm));
    showDashboard.addEventListener('click', () => {
        showSection(dashboard);
        fetchUserData(); // Iniciar actualización automática al mostrar el dashboard
    });
    cancelEdit.addEventListener('click', () => showSection(dashboard));
    document.getElementById('showForgotPassword').addEventListener('click', () => {
        showSection(resetPasswordForm); // Muestra el formulario de recuperación de contraseña
    });
});
