// config.js - VERSIÓN CORREGIDA
const SUPABASE_URL = 'https://jotvfeqpjknttvzgsqzd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdHZmZXFwamtudHR2emdzcXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTcwOTcsImV4cCI6MjA3OTI3MzA5N30.D0DzosZhZhTvUufHN1i2DYjzbGaSxc-3-nOmM1CPcrM';
const WHATSAPP_NUMBER = '5493865244579'; // Formato internacional completo
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

// Inicializar cliente de Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// FUNCIÓN ÚNICA PARA GENERAR ENLACES DE WHATSAPP
function generateWhatsAppLink(message) {
    const userRole = localStorage.getItem('userRole') || 'invitado';
    const username = localStorage.getItem('username') || 'No identificado';
    const currentPage = window.location.pathname.split('/').pop();
    
    const additionalInfo = `%0A%0A---%0AUsuario: ${username}%0ARol: ${userRole}%0APágina: ${currentPage}%0AFecha: ${new Date().toLocaleDateString()}`;
    const fullMessage = message + additionalInfo;
    
    return `${WHATSAPP_URL}?text=${encodeURIComponent(fullMessage)}`;
}

// Configurar enlaces de WhatsApp automáticamente
function setupWhatsAppLinks() {
    console.log('Configurando enlaces de WhatsApp...');
    
    // Configurar enlaces existentes
    const whatsappLinks = document.querySelectorAll('a[href*="whatsapp"], .whatsapp-btn, .whatsapp-link');
    
    whatsappLinks.forEach(link => {
        const currentHref = link.getAttribute('href');
        if (!currentHref || currentHref === '#' || currentHref.includes('wa.me')) {
            const defaultMessage = link.getAttribute('data-message') || 'Hola, necesito ayuda con el sistema del gimnasio';
            link.href = generateWhatsAppLink(defaultMessage);
            console.log('Enlace de WhatsApp configurado:', link.href);
        }
    });
    
    // Configurar botón específico de soporte en login
    const whatsappSupport = document.getElementById('whatsappSupport');
    if (whatsappSupport) {
        whatsappSupport.href = generateWhatsAppLink('Hola, tengo problemas para acceder al sistema del gimnasio');
    }
}

// Ejecutar configuración cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupWhatsAppLinks, 100);
});

// Re-ejecutar cuando cambie la autenticación
window.addEventListener('storage', function(e) {
    if (e.key === 'userRole' || e.key === 'username') {
        setTimeout(setupWhatsAppLinks, 100);
    }
});

// Exportar para usar en otros archivos
window.supabaseClient = supabaseClient;
window.generateWhatsAppLink = generateWhatsAppLink;
window.setupWhatsAppLinks = setupWhatsAppLinks;