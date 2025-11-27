// js/dashboard.js - VERSIÓN CON ALERTAS
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    const technicalSupport = document.getElementById('technicalSupport');
    const maintenanceSupport = document.getElementById('maintenanceSupport');
    const updatesSupport = document.getElementById('updatesSupport');

    // Verificar autenticación
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    // Configurar enlaces de WhatsApp
    if (technicalSupport) {
        technicalSupport.href = generateWhatsAppLink('Hola, soy administrador y necesito soporte técnico urgente');
    }
    if (maintenanceSupport) {
        maintenanceSupport.href = generateWhatsAppLink('Hola, solicito mantenimiento preventivo del sistema');
    }
    if (updatesSupport) {
        updatesSupport.href = generateWhatsAppLink('Hola, quiero información sobre nuevas actualizaciones y características');
    }
    
    // Configurar menú hamburguesa (ya hecho por auth.js)
    
    // Cargar datos del dashboard
    loadDashboardData();

    // Cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Cerrar sesión
function handleLogout(e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'index.html';
}

// Funciones del dashboard
async function loadDashboardData() {
    try {
        // Cargar miembros
        const { data: members, error: membersError } = await supabaseClient
            .from('members')
            .select('*');

        if (membersError) throw membersError;

        // Cargar empleados
        const { data: employees, error: employeesError } = await supabaseClient
            .from('employees')
            .select('*')
            .eq('active', true);

        if (employeesError) throw employeesError;

        updateStats(members || [], employees || []);
        renderExpiringMembers(members || []);
        showAlerts(members || []); // Mostrar alertas
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        alert('Error al cargar datos del dashboard: ' + error.message);
    }
}

function updateStats(members, employees) {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => getStatus(m.fecha_vencimiento) === 'activo').length;
    const expiredMembers = members.filter(m => getStatus(m.fecha_vencimiento) === 'vencido').length;
    const expiringSoon = members.filter(m => getStatus(m.fecha_vencimiento) === 'proximo').length;
    const totalEmployees = employees.length;
    
    // Calcular ingresos mensuales (solo miembros activos)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = members
        .filter(m => {
            const memberMonth = new Date(m.fecha_inicio).getMonth();
            const memberYear = new Date(m.fecha_inicio).getFullYear();
            return memberMonth === currentMonth && memberYear === currentYear && getStatus(m.fecha_vencimiento) !== 'vencido';
        })
        .reduce((sum, member) => sum + (member.monto || 0), 0);

    // Actualizar estadísticas en la interfaz
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    updateElement('totalMembers', totalMembers);
    updateElement('activeMembers', activeMembers);
    updateElement('expiredMembers', expiredMembers);
    updateElement('expiringSoon', expiringSoon);
    updateElement('totalEmployees', totalEmployees);
    updateElement('monthlyRevenue', `$${monthlyRevenue.toFixed(2)}`);
}

function getStatus(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return 'vencido';
    } else if (diffDays <= 7) {
        return 'proximo';
    } else {
        return 'activo';
    }
}

function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES');
}

function renderExpiringMembers(members) {
    const expiringTable = document.getElementById('expiringTable');
    if (!expiringTable) return;

    const expiringMembers = members.filter(m => getStatus(m.fecha_vencimiento) === 'proximo');

    if (expiringMembers.length === 0) {
        expiringTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No hay miembros próximos a vencer</td></tr>';
        return;
    }

    expiringTable.innerHTML = expiringMembers.map(member => {
        const expiryDate = new Date(member.fecha_vencimiento);
        const today = new Date();
        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        return `
            <tr>
                <td>${member.nombre}</td>
                <td>${member.plan}</td>
                <td>${formatDate(member.fecha_vencimiento)}</td>
                <td>${diffDays} días</td>
                <td>
                    <button class="action-btn edit-btn" onclick="location.href='gestion-mensuales.html'">Gestionar</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Función para mostrar alertas
function showAlerts(members) {
    const alertSection = document.getElementById('alertSection');
    const alertsContainer = document.getElementById('alertsContainer');
    
    const expiringMembers = members.filter(m => getStatus(m.fecha_vencimiento) === 'proximo');
    const expiredMembers = members.filter(m => getStatus(m.fecha_vencimiento) === 'vencido');
    
    let alertsHTML = '';
    
    if (expiredMembers.length > 0) {
        alertsHTML += `
            <div class="alert-item expired">
                <div class="alert-icon">❌</div>
                <div class="alert-content">
                    <strong>${expiredMembers.length} miembro(s) vencido(s)</strong>
                    <p>Los siguientes miembros tienen su membresía vencida:</p>
                    <ul>
                        ${expiredMembers.slice(0, 5).map(m => 
                            `<li><strong>${m.nombre}</strong> - Vencido el ${formatDate(m.fecha_vencimiento)}</li>`
                        ).join('')}
                    </ul>
                    ${expiredMembers.length > 5 ? `<p>... y ${expiredMembers.length - 5} más</p>` : ''}
                    <div style="margin-top: 1rem;">
                        <a href="gestion-mensuales.html" class="action-btn edit-btn" style="display: inline-block;">Gestionar Miembros Vencidos</a>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (expiringMembers.length > 0) {
        alertsHTML += `
            <div class="alert-item expiring">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                    <strong>${expiringMembers.length} miembro(s) próximo(s) a vencer</strong>
                    <p>Los siguientes miembros vencen en los próximos 7 días:</p>
                    <ul>
                        ${expiringMembers.slice(0, 5).map(m => {
                            const days = getDaysUntilExpiry(m.fecha_vencimiento);
                            return `<li><strong>${m.nombre}</strong> - Vence en ${days} días (${formatDate(m.fecha_vencimiento)})</li>`;
                        }).join('')}
                    </ul>
                    ${expiringMembers.length > 5 ? `<p>... y ${expiringMembers.length - 5} más</p>` : ''}
                    <div style="margin-top: 1rem;">
                        <a href="gestion-mensuales.html" class="action-btn edit-btn" style="display: inline-block;">Gestionar Miembros Próximos</a>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (alertsHTML) {
        alertsContainer.innerHTML = alertsHTML;
        alertSection.style.display = 'block';
    } else {
        alertSection.style.display = 'none';
    }
}

// Hacer funciones disponibles globalmente
window.loadDashboardData = loadDashboardData;