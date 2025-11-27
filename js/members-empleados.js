// js/members-empleados.js - VERSIÓN OPTIMIZADA PARA EMPLEADOS
let editingId = null;
let allMembers = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando módulo de miembros para empleados...');
    initializeMembersModule();
});

function initializeMembersModule() {
    const memberForm = document.getElementById('memberForm');
    const searchInput = document.getElementById('searchInput');

    // Verificar autenticación
    if (!requireAuth()) return;

    // Configurar página
    setupPage();

    // Cargar miembros
    loadMembers();

    // Configurar eventos
    if (memberForm) {
        memberForm.addEventListener('submit', handleMemberSubmit);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterMembers);
    }

    // Establecer fecha actual por defecto
    setCurrentDate();

    // Configurar filtros rápidos
    setupQuickFilters();
    
    // Configurar opciones de pago
    setupPaymentOptions();
}

function setupPage() {
    // Configurar menú hamburguesa (ya hecho por auth.js)
    // Configurar enlaces de WhatsApp
    setupWhatsAppLinks();
}

function setCurrentDate() {
    const fechaInicio = document.getElementById('fechaInicio');
    if (fechaInicio) {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        fechaInicio.value = formattedDate;
    }
}

function setupQuickFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos los botones
            filterButtons.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            currentFilter = filter;
            filterMembers();
        });
    });
}

// Nueva función para configurar opciones de pago
function setupPaymentOptions() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    const planSelect = document.getElementById('plan');

    if (paymentOptions.length > 0) {
        paymentOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remover selección anterior
                paymentOptions.forEach(opt => opt.classList.remove('selected'));
                // Agregar selección actual
                this.classList.add('selected');
                
                const plan = this.getAttribute('data-plan');
                
                // Actualizar campo del formulario
                if (planSelect) planSelect.value = plan;
            });
        });

        // Seleccionar "Mensual" por defecto
        if (paymentOptions[2]) {
            paymentOptions[2].click();
        }
    }

    // También manejar cambios en el select
    if (planSelect) {
        planSelect.addEventListener('change', function() {
            const selectedPlan = this.value;
            const option = document.querySelector(`.payment-option[data-plan="${selectedPlan}"]`);
            if (option) {
                // Remover selección anterior
                document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
                // Agregar selección actual
                option.classList.add('selected');
            }
        });
    }
}

// Funciones para miembros
function calculateExpiryDate(startDate, plan) {
    const date = new Date(startDate);
    switch(plan) {
        case 'Día':
            date.setDate(date.getDate() + 1);
            break;
        case 'Semana':
            date.setDate(date.getDate() + 7);
            break;
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
            .order('fecha_vencimiento', { ascending: true });

        if (error) {
            console.error('Error de Supabase:', error);
            throw new Error(`Error de base de datos: ${error.message}`);
        }

        console.log('Miembros cargados:', members?.length || 0);
        allMembers = members || [];
        renderMembers(allMembers);
        showAlerts(allMembers);
        
    } catch (error) {
        console.error('Error al cargar miembros:', error);
        showError('Error al cargar miembros: ' + error.message);
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

    updateResultsCount(members.length);
}

function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `${count} miembro${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }
}

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

function showError(message) {
    alert(message);
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
            result = await supabaseClient
                .from('members')
                .update(memberData)
                .eq('id', editingId);
        } else {
            result = await supabaseClient
                .from('members')
                .insert([memberData]);
        }

        if (result.error) throw result.error;

        const successMessage = editingId ? 'Miembro actualizado correctamente' : 'Miembro agregado correctamente';
        alert(successMessage);

        // Limpiar formulario
        resetForm();
        loadMembers();
        
    } catch (error) {
        console.error('Error al guardar miembro:', error);
        alert('Error al guardar miembro: ' + error.message);
    }
}

function resetForm() {
    document.getElementById('memberForm').reset();
    editingId = null;
    
    const submitBtn = document.querySelector('.btn');
    if (submitBtn) {
        submitBtn.textContent = 'Agregar Miembro';
    }
    
    setCurrentDate();
    
    // Restablecer selección de plan a Mensual
    const paymentOptions = document.querySelectorAll('.payment-option');
    if (paymentOptions[2]) {
        paymentOptions[2].click();
    }
}

async function editMember(id) {
    try {
        const { data: member, error } = await supabaseClient
            .from('members')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Llenar formulario
        document.getElementById('nombre').value = member.nombre || '';
        document.getElementById('telefono').value = member.telefono || '';
        document.getElementById('email').value = member.email || '';
        document.getElementById('plan').value = member.plan || '';
        document.getElementById('fechaInicio').value = member.fecha_inicio || '';
        document.getElementById('monto').value = member.monto || '';
        
        editingId = id;
        
        const submitBtn = document.querySelector('.btn');
        if (submitBtn) {
            submitBtn.textContent = 'Actualizar Miembro';
        }
        
        // Seleccionar la opción de pago correspondiente
        const paymentOption = document.querySelector(`.payment-option[data-plan="${member.plan}"]`);
        if (paymentOption) {
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
            paymentOption.classList.add('selected');
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error al cargar miembro:', error);
        alert('Error al cargar miembro: ' + error.message);
    }
}

async function deleteMember(id) {
    if (!confirm('¿Estás seguro de eliminar este miembro?')) return;

    try {
        const { error } = await supabaseClient
            .from('members')
            .delete()
            .eq('id', id);

        if (error) throw error;

        loadMembers();
        alert('Miembro eliminado correctamente');
    } catch (error) {
        console.error('Error al eliminar miembro:', error);
        alert('Error al eliminar miembro: ' + error.message);
    }
}

// Hacer funciones disponibles globalmente
window.editMember = editMember;
window.deleteMember = deleteMember;
window.handleMemberSubmit = handleMemberSubmit;
window.filterMembers = filterMembers;
window.getStatus = getStatus;
window.getDaysUntilExpiry = getDaysUntilExpiry;
window.formatDate = formatDate;
window.renderMembers = renderMembers;