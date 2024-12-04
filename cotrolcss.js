

document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    
    // Abrir y cerrar el dropdown
    document.querySelectorAll('.dropdown-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const dropdown = this.closest('.dropdown');
            dropdown.classList.toggle('open');
        });
    });

    // Cerrar el dropdown si se hace clic fuera
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        }
    });

    // Agregar evento mouseover
    loginButton.addEventListener('mouseover', () => {
        loginButton.style.backgroundColor = '#45a049';
    });

    // Agregar evento mouseout
    loginButton.addEventListener('mouseout', () => {
        loginButton.style.backgroundColor = '#4CAF50';
    });


    institucionTipo.addEventListener('change', () => {
        if (institucionTipo.value === "1") { // Servicio de Rentas Internas (SRI)
            ciAdicional.disabled = false;  // Habilitar
        } else {
            ciAdicional.disabled = true;   // Deshabilitar
        }
    });
    
    
    

});