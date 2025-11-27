// config.js - VERSIÓN CORREGIDA
const SUPABASE_URL = 'https://jotvfeqpjknttvzgsqzd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdHZmZXFwamtudHR2emdzcXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTcwOTcsImV4cCI6MjA3OTI3MzA5N30.D0DzosZhZhTvUufHN1i2DYjzbGaSxc-3-nOmM1CPcrM';
const WHATSAPP_NUMBER = '3865244579';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

// Inicializar cliente de Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// FUNCIÓN GENERATE WHATSAPP LINK
function generateWhatsAppLink(message) {
    const userRole = localStorage.getItem('userRole') || 'invitado';
    const username = localStorage.getItem('username') || 'No identificado';
    const currentPage = window.location.pathname.split('/').pop();
    
    const additionalInfo = `%0A%0A---%0AUsuario: ${username}%0ARol: ${userRole}%0APágina: ${currentPage}%0AFecha: ${new Date().toLocaleDateString()}`;
    const fullMessage = message + additionalInfo;
    
    return `${WHATSAPP_URL}?text=${encodeURIComponent(fullMessage)}`;
}

// Exportar para usar en otros archivos
window.supabaseClient = supabaseClient;
window.generateWhatsAppLink = generateWhatsAppLink;