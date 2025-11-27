// js/dashboard-completo.js - DASHBOARD CON GESTIÓN COMPLETA DE MENSUALES
let editingId = null;
let allMembers = [];
let currentFilter = 'all';
let currentPeriod = 'today';
let customStartDate = null;
let customEndDate = null;

document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    const technicalSupport = document.getElementById('technicalSupport');
    const maintenanceSupport = document.getElementById('maintenanceSupport');
    const updatesSupport = document.getElementById('updatesSupport');
    const memberForm = document.getElementById('memberForm');
    const searchInput = document.getElementById('searchInput');
    const cancelBtn = document.getElementById('cancelBtn');
    const submitBtn = document.getElementById('submitBtn');
    const formTitle = document.getElementById('formTitle');

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
    
    // Inicializar módulo de miembros
    initializeMembersModule();
    
    // Configurar eventos del formulario
    if (memberForm) {
        memberForm.addEventListener('submit', handleMemberSubmit);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetForm);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterMembers);
    }

    // Cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

function initializeMembersModule() {
    // Establecer fecha actual por defecto
    setCurrentDate();
    
    // Configurar filtros rápidos
    setupQuickFilters();
    
    // Configurar opciones de pago
    setupPaymentOptions();
    
    // Configurar filtros de tiempo
    setupTimeFilters();
    
    // Cargar datos iniciales
    loadDashboardData();
    
    // Agregar diagnóstico
    setTimeout(() => {
        diagnosticarFechas();
    }, 2000);
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

    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remover selección anterior
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            // Agregar selección actual
            this.classList.add('selected');
            
            const plan = this.getAttribute('data-plan');
            const duration = this.getAttribute('data-duration');
            
            // Actualizar campos del formulario
            document.getElementById('selectedPlanType').value = plan;
            document.getElementById('selectedPlanDuration').value = duration;
            
            if (planSelect) planSelect.value = plan;
        });
    });

    // Seleccionar "Mensual" por defecto
    if (paymentOptions[2]) {
        paymentOptions[2].click();
    }

    // También manejar cambios en el select
    if (planSelect) {
        planSelect.addEventListener('change', function() {
            const selectedPlan = this.value;
            const option = document.querySelector(`.payment-option[data-plan="${selectedPlan}"]`);
            if (option) {
                option.click();
            }
        });
    }
}

// Nueva función para configurar filtros de tiempo
function setupTimeFilters() {
    const timeFilterBtns = document.querySelectorAll('.time-filter-btn');
    const customDateRange = document.getElementById('customDateRange');

    timeFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos los botones
            timeFilterBtns.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            const period = this.getAttribute('data-period');
            currentPeriod = period;
            
            // Mostrar/ocultar selector de fecha personalizado
            if (customDateRange) {
                if (period === 'custom') {
                    customDateRange.classList.add('active');
                } else {
                    customDateRange.classList.remove('active');
                    loadIncomeStats(period);
                }
            }
            
            if (period !== 'custom') {
                loadIncomeStats(period);
            }
        });
    });

    // Establecer fechas por defecto para el selector personalizado
    const today = new Date();
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.value = today.toISOString().split('T')[0];
    }
    if (endDateInput) {
        endDateInput.value = today.toISOString().split('T')[0];
    }
}

// Nueva función para aplicar rango de fecha personalizado
function applyCustomDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Por favor selecciona ambas fechas');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('La fecha de inicio no puede ser mayor que la fecha de fin');
        return;
    }
    
    customStartDate = startDate;
    customEndDate = endDate;
    loadIncomeStats('custom');
}

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

        allMembers = members || [];
        updateStats(allMembers, employees || []);
        renderMembers(allMembers);
        showAlerts(allMembers);
        loadIncomeStats(currentPeriod); // Cargar estadísticas de ingresos
        
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        showError('Error al cargar datos: ' + error.message);
    }
}

function updateStats(members, employees = []) {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => getStatus(m.fecha_vencimiento) === 'activo').length;
    const expiredMembers = members.filter(m => getStatus(m.fecha_vencimiento) === 'vencido').length;
    const expiringSoon = members.filter(m => getStatus(m.fecha_vencimiento) === 'proximo').length;
    const totalEmployees = employees.length;

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
}

// Funciones para gestión de miembros
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
                        ${expiredMembers.slice(0, 3).map(m => 
                            `<li><strong>${m.nombre}</strong> - Vencido el ${formatDate(m.fecha_vencimiento)}</li>`
                        ).join('')}
                    </ul>
                    ${expiredMembers.length > 3 ? `<p>... y ${expiredMembers.length - 3} más</p>` : ''}
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
                        ${expiringMembers.slice(0, 3).map(m => {
                            const days = getDaysUntilExpiry(m.fecha_vencimiento);
                            return `<li><strong>${m.nombre}</strong> - Vence en ${days} días (${formatDate(m.fecha_vencimiento)})</li>`;
                        }).join('')}
                    </ul>
                    ${expiringMembers.length > 3 ? `<p>... y ${expiringMembers.length - 3} más</p>` : ''}
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

// FUNCIONES COMPLETAMENTE CORREGIDAS PARA CÁLCULO DE INGRESOS

// Nueva función para cargar estadísticas de ingresos - COMPLETAMENTE CORREGIDA
async function loadIncomeStats(period = 'today') {
    try {
        // Cargar todos los miembros para calcular ingresos
        const { data: members, error } = await supabaseClient
            .from('members')
            .select('*');

        if (error) throw error;

        console.log('=== CARGANDO ESTADÍSTICAS DE INGRESOS ===');
        console.log('Total de miembros cargados:', members?.length || 0);
        
        // Mostrar información de depuración
        if (members && members.length > 0) {
            console.log('Muestra de miembros:');
            members.slice(0, 5).forEach(member => {
                console.log(`- ${member.nombre}: ${member.fecha_inicio} - $${member.monto}`);
            });
        }

        // Calcular ingresos para diferentes periodos
        const dailyIncome = calculateIncomeForPeriod(members, 'today');
        const weeklyIncome = calculateIncomeForPeriod(members, 'week');
        const monthlyIncome = calculateIncomeForPeriod(members, 'month');
        const selectedPeriodIncome = calculateIncomeForPeriod(members, period);

        console.log('=== RESULTADOS CALCULADOS ===');
        console.log('Diario:', dailyIncome);
        console.log('Semanal:', weeklyIncome);
        console.log('Mensual:', monthlyIncome);
        console.log('Periodo seleccionado:', selectedPeriodIncome);
        console.log('Tipo de periodo:', period);

        // Actualizar la interfaz
        updateIncomeStats(dailyIncome, weeklyIncome, monthlyIncome, selectedPeriodIncome, period);
        
    } catch (error) {
        console.error('Error al cargar estadísticas de ingresos:', error);
    }
}

// Función para calcular ingresos por periodo - VERSIÓN SIMPLIFICADA Y ROBUSTA
function calculateIncomeForPeriod(members, period) {
    if (!members || members.length === 0) {
        console.log(`No hay miembros para calcular periodo: ${period}`);
        return 0;
    }
    
    const today = new Date();
    const hoy = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    console.log(`=== CALCULANDO PERIODO: ${period} ===`);
    console.log('Fecha de hoy:', hoy);
    
    let total = 0;
    let miembrosEnPeriodo = 0;
    
    members.forEach(member => {
        if (!member.fecha_inicio) {
            console.log(`Miembro sin fecha: ${member.nombre}`);
            return;
        }
        
        const fechaMiembro = member.fecha_inicio.split('T')[0]; // Solo la parte de la fecha
        const monto = parseFloat(member.monto) || 0;
        
        console.log(`Procesando: ${member.nombre} - Fecha: ${fechaMiembro} - Monto: $${monto}`);
        
        let incluir = false;
        
        switch(period) {
            case 'today':
                // Solo miembros de hoy
                if (fechaMiembro === hoy) {
                    incluir = true;
                    console.log(`✓ ${member.nombre} INCLUIDO en HOY`);
                }
                break;
                
            case 'week':
                // Miembros de los últimos 7 días (incluyendo hoy)
                const fechaMember = new Date(fechaMiembro);
                const hace7Dias = new Date(today);
                hace7Dias.setDate(today.getDate() - 6); // Últimos 7 días incluyendo hoy
                hace7Dias.setHours(0, 0, 0, 0);
                
                const fechaMemberNormalizada = new Date(fechaMember);
                fechaMemberNormalizada.setHours(12, 0, 0, 0); // Normalizar hora
                
                if (fechaMemberNormalizada >= hace7Dias && fechaMemberNormalizada <= today) {
                    incluir = true;
                    console.log(`✓ ${member.nombre} INCLUIDO en SEMANA (${fechaMiembro})`);
                }
                break;
                
            case 'month':
                // Miembros de este mes (desde día 1 hasta hoy)
                const fechaMemberMonth = new Date(fechaMiembro);
                const inicioMes = new Date(today.getFullYear(), today.getMonth(), 1);
                inicioMes.setHours(0, 0, 0, 0);
                
                const fechaMemberMonthNormalizada = new Date(fechaMemberMonth);
                fechaMemberMonthNormalizada.setHours(12, 0, 0, 0);
                
                if (fechaMemberMonthNormalizada >= inicioMes && fechaMemberMonthNormalizada <= today) {
                    incluir = true;
                    console.log(`✓ ${member.nombre} INCLUIDO en MES (${fechaMiembro})`);
                }
                break;
                
            case 'custom':
                if (!customStartDate || !customEndDate) break;
                const customStart = customStartDate.split('T')[0];
                const customEnd = customEndDate.split('T')[0];
                
                if (fechaMiembro >= customStart && fechaMiembro <= customEnd) {
                    incluir = true;
                    console.log(`✓ ${member.nombre} INCLUIDO en PERSONALIZADO (${fechaMiembro})`);
                }
                break;
        }
        
        if (incluir) {
            total += monto;
            miembrosEnPeriodo++;
        }
    });
    
    console.log(`=== RESUMEN PERIODO ${period} ===`);
    console.log(`Miembros encontrados: ${miembrosEnPeriodo}`);
    console.log(`Ingreso total: $${total}`);
    
    return total;
}

// Función para actualizar las estadísticas de ingresos en la interfaz
function updateIncomeStats(daily, weekly, monthly, selected, period) {
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = `$${value.toFixed(2)}`;
            console.log(`Interfaz - ${id}: $${value.toFixed(2)}`);
        }
    };

    updateElement('dailyIncome', daily);
    updateElement('weeklyIncome', weekly);
    updateElement('monthlyIncome', monthly);
    updateElement('selectedPeriodIncome', selected);

    // Actualizar etiqueta del periodo seleccionado
    const periodLabel = document.getElementById('selectedPeriodLabel');
    if (periodLabel) {
        const labels = {
            'today': 'Hoy',
            'week': 'Esta Semana',
            'month': 'Este Mes',
            'custom': 'Periodo Personalizado'
        };
        periodLabel.textContent = labels[period] || 'Periodo Seleccionado';
    }
    
    console.log('=== INTERFAZ ACTUALIZADA ===');
    console.log('Diario:', daily);
    console.log('Semanal:', weekly);
    console.log('Mensual:', monthly);
    console.log('Seleccionado:', selected);
}

// Función de diagnóstico para verificar fechas
async function diagnosticarFechas() {
    try {
        const { data: members, error } = await supabaseClient
            .from('members')
            .select('nombre, fecha_inicio, monto')
            .order('fecha_inicio', { ascending: false })
            .limit(10);

        if (error) throw error;

        console.log('=== DIAGNÓSTICO COMPLETO DE FECHAS ===');
        
        const hoy = new Date();
        const hace7Dias = new Date(hoy);
        hace7Dias.setDate(hoy.getDate() - 6);
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        
        console.log('Fechas de referencia:');
        console.log('- Hoy:', hoy.toLocaleDateString('es-ES'));
        console.log('- Hace 7 días:', hace7Dias.toLocaleDateString('es-ES'));
        console.log('- Inicio del mes:', inicioMes.toLocaleDateString('es-ES'));
        
        console.log('Miembros más recientes:');
        
        if (members && members.length > 0) {
            let miembrosHoy = 0;
            let miembrosSemana = 0;
            let miembrosMes = 0;
            
            members.forEach(member => {
                const fecha = new Date(member.fecha_inicio);
                const fechaStr = fecha.toLocaleDateString('es-ES');
                const fechaISO = member.fecha_inicio.split('T')[0];
                const hoyISO = hoy.toISOString().split('T')[0];
                
                const esHoy = fechaISO === hoyISO;
                const esSemana = fecha >= hace7Dias && fecha <= hoy;
                const esMes = fecha >= inicioMes && fecha <= hoy;
                
                if (esHoy) miembrosHoy++;
                if (esSemana) miembrosSemana++;
                if (esMes) miembrosMes++;
                
                console.log(`- ${member.nombre}:`);
                console.log(`  Fecha: ${member.fecha_inicio} (${fechaStr})`);
                console.log(`  Monto: $${member.monto}`);
                console.log(`  Es hoy: ${esHoy}`);
                console.log(`  Es esta semana: ${esSemana}`);
                console.log(`  Es este mes: ${esMes}`);
            });
            
            console.log('=== CONTEO DIAGNÓSTICO ===');
            console.log(`Miembros de hoy: ${miembrosHoy}`);
            console.log(`Miembros de esta semana: ${miembrosSemana}`);
            console.log(`Miembros de este mes: ${miembrosMes}`);
            console.log(`Total de miembros revisados: ${members.length}`);
            
        } else {
            console.log('No hay miembros en la base de datos');
        }
        
    } catch (error) {
        console.error('Error en diagnóstico:', error);
    }
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

        // Limpiar formulario y recargar datos
        resetForm();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error al guardar miembro:', error);
        alert('Error al guardar miembro: ' + error.message);
    }
}

function resetForm() {
    document.getElementById('memberForm').reset();
    editingId = null;
    
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const formTitle = document.getElementById('formTitle');
    
    if (submitBtn) {
        submitBtn.textContent = '➕ Agregar Miembro';
    }
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    if (formTitle) {
        formTitle.textContent = 'Agregar Nuevo Miembro';
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
        
        const submitBtn = document.getElementById('submitBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const formTitle = document.getElementById('formTitle');
        
        if (submitBtn) {
            submitBtn.textContent = '💾 Actualizar Miembro';
        }
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-block';
        }
        if (formTitle) {
            formTitle.textContent = 'Editar Miembro';
        }
        
        // Seleccionar la opción de pago correspondiente
        const paymentOption = document.querySelector(`.payment-option[data-plan="${member.plan}"]`);
        if (paymentOption) {
            paymentOption.click();
        }
        
        // Scroll al formulario
        document.querySelector('.form-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
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

        loadDashboardData();
        alert('Miembro eliminado correctamente');
    } catch (error) {
        console.error('Error al eliminar miembro:', error);
        alert('Error al eliminar miembro: ' + error.message);
    }
}

function showError(message) {
    alert(message);
}

// Hacer funciones disponibles globalmente
window.editMember = editMember;
window.deleteMember = deleteMember;
window.handleMemberSubmit = handleMemberSubmit;
window.filterMembers = filterMembers;
window.getStatus = getStatus;
window.getDaysUntilExpiry = getDaysUntilExpiry;
window.formatDate = formatDate;
window.loadDashboardData = loadDashboardData;
window.applyCustomDateRange = applyCustomDateRange;
window.loadIncomeStats = loadIncomeStats;