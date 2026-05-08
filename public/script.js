let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));

if (token) {
    initApp();
}

function toggleAuth() {
    const l = document.getElementById('login-form');
    const r = document.getElementById('register-form');
    l.style.display = l.style.display === 'none' ? 'block' : 'none';
    r.style.display = r.style.display === 'none' ? 'block' : 'none';
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            location.reload();
        } else {
            alert(data.message);
            if (data.isBlocked) {
                showForgotPassword();
            }
        }
    } catch (e) {
        alert('Error de conexión con el servidor');
    }
}

function showForgotPassword() {
    const email = prompt('Ingrese su email para recibir el código de recuperación:');
    if (!email) return;
    
    fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    }).then(res => res.json()).then(data => {
        alert(data.message + '\n(Revisa la consola del servidor para ver el código)');
        const token = prompt('Ingrese el código de 6 dígitos:');
        if (!token) return;
        const newPassword = prompt('Ingrese su nueva contraseña (mín. 8 caracteres):');
        if (newPassword.length < 8) {
            alert('Contraseña demasiado corta');
            return;
        }
        
        fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token, newPassword })
        }).then(res => res.json()).then(data => {
            alert(data.message);
        });
    });
}

async function register() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role })
    });
    
    if (res.ok) { 
        alert('Registro exitoso. Ya puedes iniciar sesión.'); 
        toggleAuth(); 
    } else {
        const data = await res.json();
        alert(data.message);
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

function initApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-section').style.display = 'grid';
    
    // Update Profile Info
    document.getElementById('user-name-display').innerText = user.username;
    document.getElementById('user-role-display').innerText = user.role.toUpperCase();
    document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${user.username}&background=random`;

    if (user.role === 'admin') {
        document.getElementById('admin-actions').style.display = 'block';
        document.getElementById('nav-sales').style.display = 'flex';
        document.getElementById('nav-users').style.display = 'flex';
    } else {
        document.getElementById('nav-sales').style.display = 'none';
        document.getElementById('nav-users').style.display = 'none';
    }
    
    showTab('catalog');
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    // Set active nav item
    const navItems = {
        'catalog': 0,
        'sales': 1,
        'users': 2,
        'profile': 3
    };
    document.querySelectorAll('.nav-item')[navItems[tabName]].classList.add('active');
    
    // Update Header Title
    const titles = {
        'catalog': 'Catálogo de Productos',
        'sales': 'Historial de Ventas',
        'users': 'Gestión de Usuarios',
        'profile': 'Configuración de Perfil'
    };
    document.getElementById('tab-title').innerText = titles[tabName];

    // Load data
    if (tabName === 'catalog') loadItems();
    if (tabName === 'sales') loadSales();
    if (tabName === 'users') loadUsers();
    if (tabName === 'profile') loadProfile();
}

function loadProfile() {
    document.getElementById('profile-username').value = user.username;
    document.getElementById('profile-email').value = user.email;
}

async function updateMyProfile() {
    const username = document.getElementById('profile-username').value;
    const password = document.getElementById('profile-password').value;

    const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
        alert('Perfil actualizado. Algunos cambios requerirán reiniciar sesión.');
        user.username = username;
        localStorage.setItem('user', JSON.stringify(user));
        initApp();
    } else {
        alert(data.message);
    }
}

async function loadItems() {
    const res = await fetch('/api/items', { headers: { 'Authorization': `Bearer ${token}` } });
    const items = await res.json();
    const list = document.getElementById('items-list');
    
    list.innerHTML = items.map(item => `
        <div class="product-card">
            <div class="product-img-container">
                <img src="${item.image_url || 'https://via.placeholder.com/300x200?text=Laptop'}" class="product-img">
            </div>
            <div class="product-info">
                <div class="product-brand">${item.brand || 'TECNOLOGÍA'}</div>
                <div class="product-name">${item.name}</div>
                <ul class="specs-list">
                    <li><i class="fas fa-microchip"></i> ${item.processor || 'Core i7'}</li>
                    <li><i class="fas fa-memory"></i> ${item.ram || '16GB'}</li>
                    <li><i class="fas fa-hdd"></i> ${item.storage || '512GB SSD'}</li>
                </ul>
                <div class="product-price">$${item.price}</div>
                
                <div class="card-actions">
                    <button class="btn-sale boleta" onclick="generateSale(${item.id}, 'boleta')">Boleta</button>
                    <button class="btn-sale factura" onclick="generateSale(${item.id}, 'factura')">Factura</button>
                </div>

                ${user.role === 'admin' ? `
                    <div class="admin-controls">
                        <button class="btn-icon edit" onclick='showEditModal(${JSON.stringify(item).replace(/'/g, "&apos;")})'>
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-icon delete" onclick="deleteItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function showAddModal() {
    document.getElementById('modal-title').innerText = 'Registrar Nuevo Producto';
    document.getElementById('prod-id').value = '';
    document.querySelectorAll('.modal-body input, .modal-body textarea').forEach(i => i.value = '');
    document.getElementById('product-modal').style.display = 'flex';
}

function showEditModal(item) {
    document.getElementById('modal-title').innerText = 'Editar Producto';
    document.getElementById('prod-id').value = item.id;
    document.getElementById('prod-name').value = item.name;
    document.getElementById('prod-brand').value = item.brand || '';
    document.getElementById('prod-price').value = item.price;
    document.getElementById('prod-cpu').value = item.processor || '';
    document.getElementById('prod-ram').value = item.ram || '';
    document.getElementById('prod-ssd').value = item.storage || '';
    document.getElementById('prod-img').value = item.image_url || '';
    document.getElementById('prod-desc').value = item.description || '';
    document.getElementById('product-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
}

async function saveProduct() {
    const id = document.getElementById('prod-id').value;
    const data = {
        name: document.getElementById('prod-name').value,
        brand: document.getElementById('prod-brand').value,
        price: parseFloat(document.getElementById('prod-price').value),
        processor: document.getElementById('prod-cpu').value,
        ram: document.getElementById('prod-ram').value,
        storage: document.getElementById('prod-ssd').value,
        image_url: document.getElementById('prod-img').value,
        description: document.getElementById('prod-desc').value
    };

    const url = id ? `/api/items/${id}` : '/api/items';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        closeModal();
        loadItems();
    } else {
        alert('Error al guardar el producto');
    }
}

async function deleteItem(id) {
    if (!confirm('¿Estás seguro de eliminar este producto definitivamente?')) return;
    const res = await fetch(`/api/items/${id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
    });
    if (res.ok) loadItems();
}

async function loadSales() {
    const res = await fetch('/api/sales', { headers: { 'Authorization': `Bearer ${token}` } });
    const sales = await res.json();
    const list = document.getElementById('sales-list');
    
    list.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Comprobante</th>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Monto</th>
                    <th>Vendedor</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                ${sales.map(s => `
                    <tr>
                        <td>#${s.id}</td>
                        <td><span class="status-badge user">${s.type.toUpperCase()}</span></td>
                        <td><strong>${s.customer_name || 'Anónimo'}</strong><br><small>${s.customer_id || '-'}</small></td>
                        <td>${s.item_name}</td>
                        <td><strong>$${s.total}</strong></td>
                        <td>${s.username || 'Sistema'}</td>
                        <td>${new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function generateSale(itemId, type) {
    const customer = prompt('Nombre del cliente:');
    if (!customer) return;
    const doc = prompt(type === 'factura' ? 'RUC:' : 'DNI:');
    
    const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ item_id: itemId, type, customer_name: customer, customer_id: doc, quantity: 1 })
    });

    if (res.ok) {
        alert('Venta procesada correctamente');
        if (document.getElementById('tab-sales').style.display === 'block') loadSales();
    }
}

async function loadUsers() {
    const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
    const users = await res.json();
    const list = document.getElementById('users-list');

    list.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Colaborador</th>
                    <th>Email</th>
                    <th>Rol Actual</th>
                    <th>Fecha de Alta</th>
                    <th>Acciones de Control</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(u => `
                    <tr>
                        <td>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <img src="https://ui-avatars.com/api/?name=${u.username}&background=random" style="width:30px; border-radius:50%">
                                <strong>${u.username}</strong>
                            </div>
                        </td>
                        <td>${u.email}</td>
                        <td><span class="status-badge ${u.role}">${u.role.toUpperCase()}</span></td>
                        <td>${new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                            <div style="display:flex; gap:5px;">
                                <button class="btn-icon edit" onclick="changeRole(${u.id}, '${u.role === 'admin' ? 'user' : 'admin'}')">
                                    <i class="fas fa-sync"></i> Alternar Rol
                                </button>
                                <button class="btn-icon delete" onclick="deleteUser(${u.id})">
                                    <i class="fas fa-user-slash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function changeRole(id, newRole) {
    const res = await fetch(`/api/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
    });
    if (res.ok) loadUsers();
}

async function deleteUser(id) {
    if (!confirm('¿Dar de baja a este colaborador del sistema?')) return;
    const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) loadUsers();
}
