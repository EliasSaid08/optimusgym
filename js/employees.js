// js/employees.js - VERSIÓN COMPLETAMENTE CORREGIDA
let editingId = null; // Variable global

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando módulo de empleados...');
    
    // La autenticación y menú hamburguesa ya están manejados por auth.js
    // Solo inicializar la funcionalidad específica de empleados
    
    const employeeForm = document.getElementById('employeeForm');
    const technicalSupport = document.getElementById('technicalSupport');
    const maintenanceSupport = document.getElementById('maintenanceSupport');
    const updatesSupport = document.getElementById('updatesSupport');

    // Verificar autenticación
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    // Configurar enlaces de WhatsApp específicos
    if (technicalSupport) {
        technicalSupport.href = generateWhatsAppLink('Hola, necesito soporte con el módulo de empleados');
    }
    if (maintenanceSupport) {
        maintenanceSupport.href = generateWhatsAppLink('Hola, problema con gestión de usuarios y permisos');
    }
    if (updatesSupport) {
        updatesSupport.href = generateWhatsAppLink('Hola, consultar actualizaciones del módulo de empleados');
    }
    
    // Cargar empleados
    loadEmployees();

    // Manejo del formulario
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleEmployeeSubmit);
    }
});

// Funciones para empleados
async function loadEmployees() {
    try {
        console.log('Cargando empleados desde Supabase...');
        
        const { data: employees, error } = await supabaseClient
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error de Supabase:', error);
            throw new Error(`Error de base de datos: ${error.message}`);
        }

        console.log('Empleados cargados:', employees);
        renderEmployees(employees || []);
    } catch (error) {
        console.error('Error al cargar empleados:', error);
        const employeesTable = document.getElementById('employeesTable');
        if (employeesTable) {
            employeesTable.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #dc3545;">
                        Error al cargar empleados: ${error.message}
                        <br><small>Verifica la configuración de la base de datos</small>
                    </td>
                </tr>
            `;
        }
    }
}

function renderEmployees(employees) {
    const employeesTable = document.getElementById('employeesTable');
    if (!employeesTable) return;

    if (employees.length === 0) {
        employeesTable.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No hay empleados registrados</td></tr>';
        return;
    }

    employeesTable.innerHTML = employees.map(employee => {
        const statusText = employee.active ? 'Activo' : 'Inactivo';
        const statusClass = employee.active ? 'activo' : 'vencido';
        
        return `
            <tr>
                <td>${employee.nombre}</td>
                <td>${employee.username}</td>
                <td>${employee.email}</td>
                <td>${employee.telefono}</td>
                <td>${employee.puesto}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="editEmployee('${employee.id}')">Editar</button>
                    <button class="action-btn ${employee.active ? 'delete-btn' : 'edit-btn'}" onclick="toggleEmployeeStatus('${employee.id}', ${!employee.active})">
                        ${employee.active ? 'Desactivar' : 'Activar'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleEmployeeSubmit(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;
    const puesto = document.getElementById('puesto').value;

    // Validaciones básicas
    if (!nombre || !username || !password || !email || !telefono || !puesto) {
        alert('Por favor complete todos los campos obligatorios');
        return;
    }

    const employeeData = {
        nombre: nombre,
        username: username,
        password: password,
        email: email,
        telefono: telefono,
        puesto: puesto,
        active: true
    };

    try {
        console.log('Guardando empleado:', employeeData);
        
        let result;
        if (editingId) {
            // Actualizar empleado existente
            result = await supabaseClient
                .from('employees')
                .update(employeeData)
                .eq('id', editingId);
        } else {
            // Crear nuevo empleado
            result = await supabaseClient
                .from('employees')
                .insert([employeeData]);
        }

        if (result.error) {
            console.error('Error de Supabase:', result.error);
            throw new Error(`Error de base de datos: ${result.error.message}`);
        }

        // Éxito
        const successMessage = editingId ? 'Empleado actualizado correctamente' : 'Empleado agregado correctamente';
        alert(successMessage);

        // Limpiar formulario
        document.getElementById('employeeForm').reset();
        editingId = null;
        
        // Actualizar texto del botón
        const submitBtn = document.querySelector('.btn');
        if (submitBtn) {
            submitBtn.textContent = 'Agregar Empleado';
        }
        
        // Recargar lista
        loadEmployees();
        
    } catch (error) {
        console.error('Error completo al guardar empleado:', error);
        alert(`Error al guardar empleado: ${error.message}\n\nVerifica:\n1. Conexión a internet\n2. Configuración de la base de datos\n3. Permisos de RLS`);
    }
}

async function editEmployee(id) {
    try {
        console.log('Editando empleado ID:', id);
        
        const { data: employee, error } = await supabaseClient
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error de Supabase:', error);
            throw new Error(`Error al cargar empleado: ${error.message}`);
        }

        // Llenar formulario con datos del empleado
        document.getElementById('nombre').value = employee.nombre || '';
        document.getElementById('username').value = employee.username || '';
        document.getElementById('password').value = employee.password || '';
        document.getElementById('email').value = employee.email || '';
        document.getElementById('telefono').value = employee.telefono || '';
        document.getElementById('puesto').value = employee.puesto || '';
        
        // Establecer modo edición
        editingId = id;
        
        // Cambiar texto del botón
        const submitBtn = document.querySelector('.btn');
        if (submitBtn) {
            submitBtn.textContent = 'Actualizar Empleado';
        }
        
        // Scroll al formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error al cargar empleado:', error);
        alert(error.message);
    }
}

async function toggleEmployeeStatus(id, newStatus) {
    if (!confirm(`¿Estás seguro de ${newStatus ? 'activar' : 'desactivar'} este empleado?`)) return;

    try {
        console.log('Cambiando estado del empleado ID:', id, 'a:', newStatus);
        
        const { error } = await supabaseClient
            .from('employees')
            .update({ active: newStatus })
            .eq('id', id);

        if (error) {
            console.error('Error de Supabase:', error);
            throw new Error(`Error al cambiar estado: ${error.message}`);
        }

        loadEmployees();
        alert(`Empleado ${newStatus ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
        console.error('Error al cambiar estado del empleado:', error);
        alert(error.message);
    }
}

// Hacer funciones disponibles globalmente
window.editEmployee = editEmployee;
window.toggleEmployeeStatus = toggleEmployeeStatus;
window.handleEmployeeSubmit = handleEmployeeSubmit;