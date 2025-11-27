// js/auth.js - VERSIÓN COMPLETAMENTE CORREGIDA
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de autenticación...');
    initializeAuth();
});

function initializeAuth() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const whatsappSupport = document.getElementById('whatsappSupport');

    // Credenciales del administrador
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'optimus2025';

    // Verificar autenticación actual
    checkCurrentAuth();

    function checkCurrentAuth() {
        const userRole = localStorage.getItem('userRole');
        const currentPage = window.location.pathname;

        console.log('Página actual:', currentPage);
        console.log('Rol del usuario:', userRole);

        // Si está en login y ya está autenticado, redirigir
        if ((currentPage.includes('index.html') || currentPage.endsWith('/')) && userRole) {
            console.log('Usuario autenticado en login, redirigiendo...');
            redirectBasedOnRole();
            return;
        }

        // Si no está en login y no está autenticado, redirigir a login
        if (!currentPage.includes('index.html') && !userRole) {
            console.log('Usuario no autenticado, redirigiendo a login...');
            window.location.href = 'index.html';
            return;
        }

        // Si está en una página válida, configurar la página
        if (userRole) {
            setupPageForUser(userRole);
        }
    }

    function setupPageForUser(userRole) {
        console.log('Configurando página para rol:', userRole);
        
        // Configurar navegación según rol
        setupNavigation(userRole);
        
        // Configurar menú hamburguesa
        setupHamburgerMenu();
        
        // Configurar enlaces de WhatsApp
        setupWhatsAppLinks();
        
        // Configurar logout
        setupLogout();
    }

    function setupNavigation(userRole) {
        const dashboardLink = document.getElementById('dashboardLink');
        const employeesLink = document.getElementById('employeesLink');
        const adminLink = document.getElementById('adminLink');
        const gestionMensualesLink = document.getElementById('gestionMensualesLink');

        // Resetear todos los enlaces primero
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (employeesLink) employeesLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (gestionMensualesLink) gestionMensualesLink.style.display = 'none';

        // Mostrar según el rol
        if (userRole === 'admin') {
            console.log('Mostrando navegación completa para admin');
            if (dashboardLink) dashboardLink.style.display = 'block';
            if (employeesLink) employeesLink.style.display = 'block';
            if (adminLink) adminLink.style.display = 'block';
            if (gestionMensualesLink) gestionMensualesLink.style.display = 'block';
            
            // Ocultar elementos solo para empleados
            const employeeElements = document.querySelectorAll('.employee-only');
            employeeElements.forEach(el => {
                el.style.display = 'none';
            });
        } else if (userRole === 'employee') {
            console.log('Mostrando navegación limitada para empleado');
            if (gestionMensualesLink) gestionMensualesLink.style.display = 'block';
            
            // Ocultar elementos de admin
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    function setupHamburgerMenu() {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');

        if (hamburger && navLinks) {
            // Remover event listeners existentes para evitar duplicados
            const newHamburger = hamburger.cloneNode(true);
            const newNavLinks = navLinks.cloneNode(true);
            
            hamburger.parentNode.replaceChild(newHamburger, hamburger);
            navLinks.parentNode.replaceChild(newNavLinks, navLinks);

            // Re-asignar variables
            const currentHamburger = document.getElementById('hamburger');
            const currentNavLinks = document.getElementById('navLinks');

            currentHamburger.addEventListener('click', function() {
                console.log('Hamburger menu clicked');
                currentHamburger.classList.toggle('active');
                currentNavLinks.classList.toggle('active');
                
                // Prevenir scroll del body cuando el menú está abierto
                if (currentNavLinks.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            });

            // Cerrar menú al hacer clic en enlaces
            currentNavLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    currentHamburger.classList.remove('active');
                    currentNavLinks.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });

            // Cerrar menú al hacer clic fuera
            document.addEventListener('click', function(event) {
                const isClickInsideNav = currentNavLinks.contains(event.target) || currentHamburger.contains(event.target);
                if (!isClickInsideNav && currentNavLinks.classList.contains('active')) {
                    currentHamburger.classList.remove('active');
                    currentNavLinks.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });

            // Cerrar menú al redimensionar la ventana (si se vuelve a desktop)
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    currentHamburger.classList.remove('active');
                    currentNavLinks.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    }

    function setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            // Remover event listener existente
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);

            const currentLogoutBtn = document.getElementById('logoutBtn');
            currentLogoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Cerrando sesión...');
                localStorage.clear();
                window.location.href = 'index.html';
            });
        }
    }

    // Configurar página de login si existe
    if (loginForm) {
        setupLoginPage();
    }

    function setupLoginPage() {
        console.log('Configurando página de login...');

        // Configurar enlace de WhatsApp para login
        if (whatsappSupport) {
            whatsappSupport.href = generateWhatsAppLink('Hola, tengo problemas para acceder al sistema del gimnasio');
        }

        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Procesando login...');
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                // Verificar si es administrador
                if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                    console.log('Login exitoso como administrador');
                    localStorage.setItem('userRole', 'admin');
                    localStorage.setItem('username', username);
                    redirectBasedOnRole();
                    return;
                }
                
                // Verificar si es empleado en la base de datos
                console.log('Verificando credenciales de empleado...');
                const { data: employees, error } = await supabaseClient
                    .from('employees')
                    .select('*')
                    .eq('username', username)
                    .eq('password', password)
                    .eq('active', true);
                
                if (error) {
                    console.error('Error de Supabase:', error);
                    throw error;
                }
                
                if (employees && employees.length > 0) {
                    console.log('Login exitoso como empleado');
                    localStorage.setItem('userRole', 'employee');
                    localStorage.setItem('username', username);
                    localStorage.setItem('employeeId', employees[0].id);
                    redirectBasedOnRole();
                } else {
                    console.log('Credenciales incorrectas');
                    showError('Credenciales incorrectas');
                }
            } catch (error) {
                console.error('Error de autenticación:', error);
                showError('Error al iniciar sesión. Intente nuevamente.');
            }
        });
    }

    function redirectBasedOnRole() {
        const userRole = localStorage.getItem('userRole');
        console.log('Redirigiendo usuario con rol:', userRole);
        
        if (userRole === 'admin') {
            window.location.href = 'dashboard.html';
        } else if (userRole === 'employee') {
            window.location.href = 'gestion-mensuales.html';
        }
    }

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
    }
}

// Verificación global de autenticación
function requireAuth() {
    const userRole = localStorage.getItem('userRole');
    if (!userRole) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Obtener información del usuario actual
function getCurrentUser() {
    return {
        role: localStorage.getItem('userRole'),
        username: localStorage.getItem('username'),
        employeeId: localStorage.getItem('employeeId')
    };
}

// Verificar permisos
function hasPermission(requiredRole) {
    const userRole = localStorage.getItem('userRole');
    if (requiredRole === 'admin') {
        return userRole === 'admin';
    }
    return true; // Los empleados tienen permisos básicos
}