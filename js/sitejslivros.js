// ============================================================
// sitejslivros.js - Funcionalidades globais do site
// Carrinho, Sidebar, Dropdowns, Menu Responsivo
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    // Seletores globais
    const avatar = document.querySelector('.avatar');
    const userDropdown = document.querySelector('.dropdown-menu.setting');
    const genresBtn = document.querySelector('.dropdown-btn');
    const genresDropdown = document.querySelector('.dropdown-container');
    const genresArrow = document.querySelector('.dropdown-btn .dropdown-arrow');
    const sidebar = document.querySelector('.sidebar');
    const barsIcon = document.querySelector('.bars');
    const cartIcon = document.querySelector('.cart-icon');
    const cartMenu = document.getElementById('cartMenu');
    const limparCarrinhoBtn = document.getElementById('limparCarrinho');
    const cartCountSpan = document.querySelector('.cart-count');
    const voltarBtn = document.getElementById('voltarBtn');
    const cartItemsList = document.getElementById('cartItems');

    // ============================================================
    // 🛒 Atualiza visualmente o menu suspenso do carrinho
    // ============================================================
    function atualizarCarrinho() {
        const items = JSON.parse(localStorage.getItem('cartItems')) || [];
        if (cartCountSpan) cartCountSpan.textContent = items.length;
        if (!cartItemsList) return;

        cartItemsList.innerHTML = '';
        if (items.length === 0) {
            cartItemsList.innerHTML = '<li class="empty">Carrinho vazio</li>';
            return;
        }

        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'cart-item';

            const span = document.createElement('span');
            span.className = 'cart-item-name';
            span.textContent = item.nome || 'Produto sem nome';

            const btn = document.createElement('button');
            btn.className = 'btn-remove-menu';
            btn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            btn.addEventListener('click', () => {
                removerItem(index);
            });

            li.appendChild(span);
            li.appendChild(btn);
            cartItemsList.appendChild(li);
        });
    }

    // Botão “Limpar Carrinho” do menu
    limparCarrinhoBtn?.addEventListener('click', function () {
        localStorage.removeItem('cartCount');
        localStorage.removeItem('cartItems');
        atualizarCarrinho();
        if (typeof renderizarCarrinho === 'function') renderizarCarrinho();
        cartMenu?.classList.remove('show');
        alert('Carrinho limpo com sucesso!');
    });

    // ============================================================
    // Funcionalidades de interface (menus, sidebar, etc.)
    // ============================================================
    avatar?.addEventListener('click', function (e) {
        e.stopPropagation();
        userDropdown?.classList.toggle('active');
    });

    genresBtn?.addEventListener('click', function (e) {
        e.stopPropagation();
        genresDropdown?.classList.toggle('active');
        genresArrow?.classList.toggle('rotate');
        if (sidebar && !sidebar.classList.contains('active')) {
            sidebar.classList.add('active');
        }
    });

    barsIcon?.addEventListener('click', function (e) {
        e.stopPropagation();
        sidebar?.classList.toggle('active');
    });

    cartIcon?.addEventListener('click', function (e) {
        e.stopPropagation();
        cartMenu?.classList.toggle('show');
        atualizarCarrinho();
    });

    voltarBtn?.addEventListener('click', function () {
        window.location.href = document.referrer;
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.sidebar') && !e.target.closest('.fa-bars')) {
            userDropdown?.classList.remove('active');
            genresDropdown?.classList.remove('active');
            genresArrow?.classList.remove('rotate');
            cartMenu?.classList.remove('show');
        }
    });

    // Estilo do ícone e contador
    if (cartIcon) cartIcon.style.marginRight = '20px';
    if (cartCountSpan) {
        cartCountSpan.style.backgroundColor = '#007BFF';
        cartCountSpan.style.color = 'white';
    }

    atualizarCarrinho();
});
