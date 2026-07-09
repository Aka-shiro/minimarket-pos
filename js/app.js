// --- CONFIGURACIÓN DE ENDPOINTS (Google Apps Script) ---
const AUTH_APP_URL = "https://script.google.com/macros/s/AKfycbwRUdCIHwy55K_7esO1SKbp7e2SVxndGDczKMYQ5SgjnbRabbrPkFmeXb9tOXiLz_QwEw/exec";
// 🔴 REEMPLAZA ESTA URL CON EL DESPLIEGUE DE TU SCRIPT 2 (PRODUCTOS)
const DATA_APP_URL = "https://script.google.com/macros/s/AKfycbw5L39AXCQnflqRx9g_UPXRFEQa9DdsKqj9UExmfM6zgCQqf0qdxyBxfKLfA8pT5lcS/exec";

// --- ESTADO DE LA APLICACIÓN ---
let isAdministrator = false;
let currentModalType = ''; 

let products = []; // Se cargará de forma dinámica desde Google Sheets 2
let cart = [];

// --- INICIALIZACIÓN DE LA APP ---
document.addEventListener("DOMContentLoaded", () => {
    loadProductsRemote(); // Trae el catálogo real de la nube
    renderCart();

    document.getElementById('search-input').addEventListener('input', filterProducts);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchText = this.value.trim().toLowerCase();
            const matchedIndex = products.findIndex(p => p.name.toLowerCase() === searchText);
            if (matchedIndex !== -1) {
                addToCart(matchedIndex);
                this.value = ''; 
                filterProducts();
            }
        }
    });
});

// --- CARGAR PRODUCTOS DESDE LA NUBE (GET) ---
function loadProductsRemote() {
    fetch(DATA_APP_URL)
    .then(response => response.json())
    .then(data => {
        products = data;
        renderCatalog();
    })
    .catch(error => {
        console.error("Error al cargar productos remotos:", error);
        // Fallback en caso de error de red usando datos base
        products = [
            { name: "Pisco Cuatro Gallos 750ml", category: "Licor", price: 42.00, stock: 15 },
            { name: "Cerveza Pilsen Trujillo 620ml", category: "Cerveza", price: 6.50, stock: 48 }
        ];
        renderCatalog();
    });
}

// --- CONTROL DE VISTAS (INTERFAZ) ---
function changeView(viewId) {
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-menu').style.display = 'none';
    document.getElementById(viewId).style.display = 'flex';
}

function showPOS() { 
    document.getElementById('welcome-screen').classList.add('hidden'); 
}

function logout() {
    isAdministrator = false;
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    changeView('view-login');
    document.getElementById('welcome-screen').classList.remove('hidden');
}

function backToMenu() {
    if (isAdministrator) {
        document.getElementById('welcome-screen').classList.remove('hidden');
        changeView('view-menu');
    } else {
        logout();
    }
}

// --- AUTENTICACIÓN (LOGIN REMOTO) ---
function processLoginRemote() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    const btnAction = document.getElementById('btn-login-action');

    if(!user || !pass) return alert('Por favor, ingresa tus credenciales.');

    btnAction.innerText = "Verificando...";
    btnAction.disabled = true;

    fetch(AUTH_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ user: user, pass: pass })
    })
    .then(response => response.json())
    .then(data => {
        const menuTitle = document.getElementById('menu-title');
        const btnRegistrar = document.getElementById('opt-registrar');
        const btnModificar = document.getElementById('opt-modificar');
        const btnUsuarios = document.getElementById('opt-usuarios');
        const roleBadge = document.getElementById('role-badge');

        btnAction.innerText = "Ingresar";
        btnAction.disabled = false;

        if (data.success) {
            if (data.role === "admin") {
                isAdministrator = true;
                menuTitle.innerText = "Panel Gerente / Administrador";
                btnRegistrar.style.display = "flex";
                btnModificar.style.display = "flex";
                btnUsuarios.style.display = "flex"; 
                roleBadge.innerText = "GERENTE / ADMIN";
                roleBadge.className = "badge-role admin";
                changeView('view-menu');
            } else {
                isAdministrator = false;
                roleBadge.innerText = "TRABAJADOR";
                roleBadge.className = "badge-role worker";
                showPOS(); 
            }
        } else {
            alert("Usuario o contraseña incorrectos. Verifica tu base de datos.");
        }
    })
    .catch(error => {
        console.error("Error de red:", error);
        alert("Inconveniente al conectar con el servidor.");
        btnAction.innerText = "Ingresar";
        btnAction.disabled = false;
    });
}

// --- CONTROL DE VENTANAS MODALES ---
function openAdminModal(type) {
    currentModalType = type;
    const prodBody = document.getElementById('body-producto');
    const userBody = document.getElementById('body-usuario');
    const titleText = document.getElementById('modal-title-text');

    if(type === 'registrar') {
        titleText.innerText = '➕ Registrar Nuevo Producto';
        prodBody.style.display = 'flex';
        userBody.style.display = 'none';
        document.getElementById('prod-name').value = '';
    } else if (type === 'modificar') {
        titleText.innerText = '✏️ Modificar por Nombre Exacto';
        prodBody.style.display = 'flex';
        userBody.style.display = 'none';
    } else if (type === 'usuario') {
        titleText.innerText = '👤 Crear Nuevo Usuario de Acceso';
        prodBody.style.display = 'none';
        userBody.style.display = 'flex'; 
        document.getElementById('new-user-name').value = '';
        document.getElementById('new-user-pass').value = '';
    }
    document.getElementById('admin-modal').style.display = 'flex';
}

function closeModal() { 
    document.getElementById('admin-modal').style.display = 'none'; 
}

function saveAdminAction() {
    if (currentModalType === 'usuario') {
        saveNewUserRemote();
    } else {
        saveAdminProductRemote();
    }
}

// --- REGISTRO DE USUARIOS EN GOOGLE SHEETS 1 ---
function saveNewUserRemote() {
    const username = document.getElementById('new-user-name').value.trim();
    const pass = document.getElementById('new-user-pass').value.trim();
    const role = document.getElementById('new-user-role').value;

    if (!username || !pass) return alert('Por favor, completa todos los campos del usuario.');

    fetch(AUTH_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
            action: "createUser",
            user: username,
            pass: pass,
            role: role
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Usuario "${username}" registrado exitosamente.`);
            closeModal();
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error al enviar el usuario.");
    });
}

// --- REGISTRO/EDICIÓN DE PRODUCTOS EN GOOGLE SHEETS 2 ---
function saveAdminProductRemote() {
    const name = document.getElementById('prod-name').value.trim();
    const category = document.getElementById('prod-category').value;
    const stock = parseInt(document.getElementById('prod-stock').value);
    const price = parseFloat(document.getElementById('prod-price').value);

    if(!name || isNaN(stock) || isNaN(price)) return alert('Completa todos los campos correctamente.');

    fetch(DATA_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
            action: "saveProduct",
            name: name,
            category: category,
            price: price,
            stock: stock
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            alert(data.message);
            loadProductsRemote(); // Recarga la lista desde la nube para actualizar la vista
            closeModal();
        }
    })
    .catch(error => {
        console.error("Error al guardar producto:", error);
        alert("Inconveniente al registrar producto en la nube.");
    });
}

// --- RENDERIZADO Y TIENDA (CATÁLOGO / CARRITO) ---
function renderCatalog(filteredProducts = products) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    filteredProducts.forEach(product => {
        const realIndex = products.findIndex(p => p.name === product.name);
        const isLow = product.stock <= 5;
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div>
                <span class="category">${product.category}</span>
                <div class="name">${product.name}</div>
            </div>
            <div>
                <div class="price">S/. ${product.price.toFixed(2)}</div>
                <div class="${isLow ? 'stock low' : 'stock ok'}">${isLow ? product.stock + ' ¡Bajo Stock!' : 'Stock: ' + product.stock}</div>
                <button class="btn-add-cart" ${product.stock === 0 ? 'disabled' : ''} onclick="addToCart(${realIndex})">⚡ Agregar</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterProducts() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const categorySelected = document.getElementById('category-filter').value;
    const filtered = products.filter(p => {
        return p.name.toLowerCase().includes(searchText) && (categorySelected === 'Todos' || p.category === categorySelected);
    });
    renderCatalog(filtered);
}

function addToCart(index) {
    const product = products[index];
    const cartItem = cart.find(item => item.name === product.name);
    if (product.stock > (cartItem ? cartItem.qty : 0)) {
        if (cartItem) cartItem.qty++;
        else cart.push({ ...product, originalIndex: index, qty: 1 });
        renderCart();
    } else alert('Sin stock físico disponible.');
}

function removeFromCart(index) { 
    cart.splice(index, 1); 
    renderCart(); 
}

function renderCart() {
    const container = document.getElementById('cart-items');
    container.innerHTML = ''; 
    let total = 0, items = 0;
    
    cart.forEach((item, index) => {
        const sub = item.price * item.qty; 
        total += sub; 
        items += item.qty;
        const row = document.createElement('div'); 
        row.className = 'cart-item';
        row.innerHTML = `<div class="cart-item-info"><strong>${item.name}</strong></div><div class="cart-item-qty">x${item.qty}</div><div class="cart-item-price">S/. ${sub.toFixed(2)}<button class="btn-remove" onclick="removeFromCart(${index})">×</button></div>`;
        container.appendChild(row);
    });
    document.getElementById('cart-total').innerText = `S/. ${total.toFixed(2)}`;
    document.getElementById('cart-count').innerText = `${items} items`;
}

// --- CONFIRMAR VENTA EN LA NUBE ---
function checkoutSale() {
    if(cart.length === 0) return alert('Carrito vacío.');
    
    // Mapeamos los elementos del carrito simplificados para el servidor
    const cartData = cart.map(item => ({ name: item.name, qty: item.qty }));

    fetch(DATA_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
            action: "checkout",
            cart: cartData
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            alert('Venta procesada y stock actualizado en Google Sheets.');
            cart = [];
            renderCart();
            loadProductsRemote(); // Sincroniza el inventario local tras la reducción de stock
        }
    })
    .catch(error => {
        console.error("Error al procesar la venta:", error);
        alert("Ocurrió un problema al subir la venta.");
    });
}
