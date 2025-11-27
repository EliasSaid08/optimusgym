// js/members.js - VERSIÓN PARA EMPLEADOS
let editingId = null;
let allMembers = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    const memberForm = document.getElementById('memberForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const searchInput = document.getElementById('searchInput');

    // Verificar autenticación
    const userRole = localStorage.getItem('userRole');
    if (!userRole) {
        window.location.href = 'index.html';
        return;
    }
    
    // Configurar menú hamburguesa
    setupHamburgerMenu();
    
    // Cargar miembros
    loadMembers();

    // Manejo del formulario
    if (memberForm) {
        memberForm.addEventListener('submit', handleMemberSubmit);
    }

    // Cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Buscador
    if (searchInput) {
        searchInput.addEventListener('input', filterMembers);
    }

    // Establecer fecha actual por defecto
    const fechaInicio = document.getElementById('fechaInicio');
    if (fechaInicio) {
        fechaInicio.valueAsDate = new Date();
    }
});

// Manejo del menú hamburguesa
function setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
}

// Cerrar sesión
function handleLogout(e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'index.html';
}

// Funciones para miembros
function calculateExpiryDate(startDate, plan) {
    const date = new Date(startDate);
    switch(plan) {
        case 'Mensual':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'Trimestral':
            date.setMonth(date.getMonth() + 3);
            break;
        case 'Semestral':
            date.setMonth(date.getMonth() + 6);
            break;
        case 'Anual':
            date.setFullYear(date.getFullYear() + 1);
            break;
        default:
            date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
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

async function loadMembers() {
    try {
        console.log('Cargando miembros desde Supabase...');
        
        const { data: members, error } = await supabaseClient
            .from('members')
            .select('*')
            .order('fecha_vencimiento', { ascending: true }); // Ordenar por vencimiento

        if (error) {
            console.error('Error de Supabase:', error);
            throw new Error(`Error de base de datos: ${error.message}`);
        }

        console.log('Miembros cargados:', members);
        allMembers = members || [];
        renderMembers(allMembers);
        
    } catch (error) {
        console.error('Error al cargar miembros:', error);
        const membersTable = document.getElementById('membersTable');
        if (membersTable) {
            membersTable.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #dc3545;">
                        Error al cargar miembros: ${error.message}
                        <br><small>Verifica la configuración de la base de datos</small>
                    </td>
                </tr>
            `;
        }
    }
}

function renderMembers(members) {
    const membersTable = document.getElementById('membersTable');
    if (!membersTable) return;

    if (members.length === 0) {
        membersTable.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No se encontraron miembros</td></tr>';
        updateResultsCount(0);
        return;
    }

    membersTable.innerHTML = members.map(member => {
        const status = getStatus(member.fecha_vencimiento);
        const daysUntil = getDaysUntilExpiry(member.fecha_vencimiento);
        const statusText = status === 'activo' ? 'Activo' : status === 'vencido' ? 'Vencido' : 'Por Vencer';
        
        // Clases para resaltar según estado
        const rowClass = status === 'vencido' ? 'expired-row' : status === 'proximo' ? 'expiring-row' : '';
        
        return `
            <tr class="${rowClass}">
                <td>
                    <strong>${member.nombre}</strong>
                    ${status === 'proximo' ? '<br><small style="color: #ed8936; font-weight: 600;">⚠️ Vence pronto</small>' : ''}
                    ${status === 'vencido' ? '<br><small style="color: #f56565; font-weight: 600;">❌ Vencido</small>' : ''}
                </td>
                <td>${member.email || '-'}</td>
                <td>${member.telefono || '-'}</td>
                <td>
                    <span class="plan-badge">${member.plan}</span>
                </td>
                <td>${formatDate(member.fecha_inicio)}</td>
                <td>
                    ${formatDate(member.fecha_vencimiento)}
                    ${status === 'proximo' ? `<br><small style="color: #ed8936;">(${daysUntil} días)</small>` : ''}
                    ${status === 'vencido' ? `<br><small style="color: #f56565;">(Vencido)</small>` : ''}
                </td>
                <td><span class="status ${status}">${statusText}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="editMember('${member.id}')">✏️ Editar</button>
                    <button class="action-btn delete-btn" onclick="deleteMember('${member.id}')">🗑️ Eliminar</button>
                </td>
            </tr>
        `;
    }).join('');

    // Actualizar contador de resultados
    updateResultsCount(members.length);
}

function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `${count} miembro${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }
}

// Función de búsqueda
function filterMembers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = allMembers.filter(member => {
        const matchesSearch = member.nombre.toLowerCase().includes(searchTerm) ||
                            (member.email && member.email.toLowerCase().includes(searchTerm)) ||
                            (member.telefono && member.telefono.includes(searchTerm));
        
        const matchesFilter = currentFilter === 'all' || 
                            getStatus(member.fecha_vencimiento) === currentFilter;
        
        return matchesSearch && matchesFilter;
    });

    renderMembers(filtered);
}

// Filtrar por estado
function filterMembersByStatus(status) {
    currentFilter = status;
    filterMembers();
}

async function handleMemberSubmit(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const email = document.getElementById('email').value;
    const plan = document.getElementById('plan').value;
    const fechaInicio = document.getElementById('fechaInicio').value;
    const monto = document.getElementById('monto').value;

    // Validaciones básicas
    if (!nombre || !plan || !fechaInicio || !monto) {
        alert('Por favor complete todos los campos obligatorios');
        return;
    }

    const memberData = {
        nombre: nombre,
        telefono: telefono || null,
        email: email || null,
        plan: plan,
        fecha_inicio: fechaInicio,
        monto: parseFloat(monto),
        fecha_vencimiento: calculateExpiryDate(fechaInicio, plan)
    };

    try {
        console.log('Guardando miembro:', memberData);
        
        let result;
        if (editingId) {
            // Actualizar miembro existente
            result = await supabaseClient
                .from('members')
                .update(memberData)
                .eq('id', editingId);
        } else {
            // Crear nuevo miembro
            result = await supabaseClient
                .from('members')
                .insert([memberData]);
        }

        if (result.error) {
            console.error('Error de Supabase:', result.error);
            throw new Error(`Error de base de datos: ${result.error.message}`);
        }

        // Éxito
        const successMessage = editingId ? 'Miembro actualizado correctamente' : 'Miembro agregado correctamente';
        alert(successMessage);

        // Limpiar formulario
        document.getElementById('memberForm').reset();
        editingId = null;
        
        // Actualizar texto del botón
        const submitBtn = document.querySelector('.btn');
        if (submitBtn) {
            submitBtn.textContent = 'Agregar Miembro';
        }
        
        // Restablecer fecha actual
        const fechaInicioInput = document.getElementById('fechaInicio');
        if (fechaInicioInput) {
            fechaInicioInput.valueAsDate = new Date();
        }
        
        // Recargar lista
        loadMembers();
        
    } catch (error) {
        console.error('Error completo al guardar miembro:', error);
        alert(`Error al guardar miembro: ${error.message}\n\nVerifica:\n1. Conexión a internet\n2. Configuración de la base de datos\n3. Permisos de RLS`);
    }
}

async function editMember(id) {
    try {
        console.log('Editando miembro ID:', id);
        
        const { data: member, error } = await supabaseClient
            .from('members')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error de Supabase:', error);
            throw new Error(`Error al cargar miembro: ${error.message}`);
        }

        // Llenar formulario con datos del miembro
        document.getElementById('nombre').value = member.nombre || '';
        document.getElementById('telefono').value = member.telefono || '';
        document.getElementById('email').value = member.email || '';
        document.getElementById('plan').value = member.plan || '';
        document.getElementById('fechaInicio').value = member.fecha_inicio || '';
        document.getElementById('monto').value = member.monto || '';
        
        // Establecer modo edición
        editingId = id;
        
        // Cambiar texto del botón
        const submitBtn = document.querySelector('.btn');
        if (submitBtn) {
            submitBtn.textContent = 'Actualizar Miembro';
        }
        
        // Scroll al formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error al cargar miembro:', error);
        alert(error.message);
    }
}

async function deleteMember(id) {
    if (!confirm('¿Estás seguro de eliminar este miembro?')) return;

    try {
        console.log('Eliminando miembro ID:', id);
        
        const { error } = await supabaseClient
            .from('members')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error de Supabase:', error);
            throw new Error(`Error al eliminar miembro: ${error.message}`);
        }

        loadMembers();
        alert('Miembro eliminado correctamente');
    } catch (error) {
        console.error('Error al eliminar miembro:', error);
        alert(error.message);
    }
}

// Hacer funciones disponibles globalmente
window.editMember = editMember;
window.deleteMember = deleteMember;
window.handleMemberSubmit = handleMemberSubmit;
window.filterMembers = filterMembers;
window.filterMembersByStatus = filterMembersByStatus;
window.getStatus = getStatus;
window.getDaysUntilExpiry = getDaysUntilExpiry;
window.formatDate = formatDate;
window.renderMembers = renderMembers;