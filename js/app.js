// REPLAZAR CON LA URL DE DESPLIEGUE COMO WEB APP DE TU GOOGLE APPS SCRIPT
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwRUdCIHwy55K_7esO1SKbp7e2SVxndGDczKMYQ5SgjnbRabbrPkFmeXb9tOXiLz_QwEw/exec";

let isAdministrator = false;
let currentModalType = ''; // Almacena qué tipo de registro se guardará ('registrar', 'modificar' o 'usuario')

let products = JSON.parse(localStorage.getItem('super_inventory')) || [
    { name: "Pisco Cuatro Gallos 750ml", category: "Licor", price: 42.00, stock: 15 },
    { name: "Cerveza Pilsen Trujillo 620ml", category: "Cerveza", price: 6.50, stock: 48 },
    { name: "Whisky Johnnie Walker Black", category: "Licor", price: 110.00, stock: 4 },
    { name: "Coca Cola Zero 1.5L", category: "Gaseosas", price: 5.50, stock: 24 }
];
let cart = [];

document.addEventListener("DOMContentLoaded", () => {
    renderCatalog();
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

function changeView(viewId) {
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-menu').style.display = 'none';
    document.getElementById(viewId).style.display = 'flex';
}

function processLoginRemote() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    const btnAction = document.getElementById('btn-login-action');

    if(!user || !pass) return alert('Por favor, ingresa tus credenciales.');

    btnAction.innerText = "Verificando...";
    btnAction.disabled = true;

    fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: user, pass: pass })
    })
    .then(() => {
        const menuTitle = document.getElementById('menu-title');
        const btnRegistrar = document.getElementById('opt-registrar');
        const btnModificar = document.getElementById('opt-modificar');
        const btnUsuarios = document.getElementById('opt-usuarios');
        const roleBadge = document.getElementById('role-badge');

        btnAction.innerText = "Ingresar";
        btnAction.disabled = false;

        // Validación y enrutamiento por roles según la cadena de entrada
        if (user.toLowerCase() === "admin") {
            isAdministrator = true;
            menuTitle.innerText = "Panel Gerente / Administrador";
            btnRegistrar.style.display = "flex";
            btnModificar.style.display = "flex";
            btnUsuarios.style.display = "flex"; // Muestra opción de usuarios
            roleBadge.innerText = "GERENTE / ADMIN";
            roleBadge.className = "badge-role admin";
            changeView('view-menu');
        } else {
            isAdministrator = false;
            roleBadge.innerText = "TRABAJADOR";
            roleBadge.className = "badge-role worker";
            showPOS(); 
        }
    })
    .catch(error => {
        console.error("Error de red:", error);
        alert("Inconveniente al conectar con el servidor.");
        btnAction.innerText = "Ingresar";
        btnAction.disabled = false;
    });
}

function logout() {
    isAdministrator = false;
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    changeView('view-login');
    document.getElementById('welcome-screen').classList.remove('hidden');
}

function showPOS() { document.getElementById('welcome-screen').classList.add('hidden'); }

function backToMenu() {
    if (isAdministrator) {
        document.getElementById('welcome-screen').classList.remove('hidden');
        changeView('view-menu');
    } else {
        logout();
    }
}

// CONTROL MODAL UNIFICADO
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
        userBody.style.display = 'flex'; // Muestra inputs de usuario
        document.getElementById('new-user-name').value = '';
        document.getElementById('new-user-pass').value = '';
    }
    document.getElementById('admin-modal').style.display = 'flex';
}

function closeModal() { document.getElementById('admin-modal').style.display = 'none'; }

function saveAdminAction() {
    if (currentModalType === 'usuario') {
        saveNewUserRemote();
    } else {
        saveAdminProduct();
    }
}

// PETICIÓN POST PARA CREAR USUARIO EN GOOGLE SHEETS
function saveNewUserRemote() {
    const username = document.getElementById('new-user-name').value.trim();
    const pass = document.getElementById('new-user-pass').value.trim();
    const role = document.getElementById('new-user-role').value;

    if (!username || !pass) return alert('Por favor, completa todos los campos del usuario.');

    fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "createUser",
            user: username,
            pass: pass,
            role: role
        })
    })
    .then(() => {
        alert(`Usuario "${username}" enviado exitosamente a la base de datos.`);
        closeModal();
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error al enviar el usuario a Google Sheets.");
    });
}

function saveAdminProduct() {
    const name = document.getElementById('prod-name').value.trim();
    const category = document.getElementById('prod-category').value;
    const stock = parseInt(document.getElementById('prod-stock').value);
    const price = parseFloat(document.getElementById('prod-price').value);

    if(!name || isNaN(stock) || isNaN(price)) return alert('Completa todos los campos correctamente.');

    const existing = products.find(p => p.name.toLowerCase() === name.toLowerCase());
    if(existing) {
        existing.stock += stock; existing.price = price; existing.category = category;
        alert('Inventario actualizado.');
    } else {
        products.push({ name, category, price, stock });
        alert('Producto registrado.');
    }
    localStorage.setItem('super_inventory', JSON.stringify(products));
    renderCatalog(); closeModal();
}

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

function removeFromCart(index) { cart.splice(index, 1); renderCart(); }

function renderCart() {
    const container = document.getElementById('cart-items');
    container.innerHTML = ''; let total = 0, items = 0;
    cart.forEach((item, index) => {
        const sub = item.price * item.qty; total += sub; items += item.qty;
        const row = document.createElement('div'); row.className = 'cart-item';
        row.innerHTML = `<div class="cart-item-info"><strong>${item.name}</strong></div><div class="cart-item-qty">x${item.qty}</div><div class="cart-item-price">S/. ${sub.toFixed(2)}<button class="btn-remove" onclick="removeFromCart(${index})">×</button></div>`;
        container.appendChild(row);
    });
    document.getElementById('cart-total').innerText = `S/. ${total.toFixed(2)}`;
    document.getElementById('cart-count').innerText = `${items} items`;
}

function checkoutSale() {
    if(cart.length === 0) return alert('Carrito vacío.');
    cart.forEach(item => { products[item.originalIndex].stock -= item.qty; });
    alert('Venta completada.'); cart = [];
    localStorage.setItem('super_inventory', JSON.stringify(products));
    renderCatalog(); renderCart();
}
