// ============================================================
// sitejslivros.js - Funcionalidades globais do site
// Carrinho, Sidebar, Dropdowns, Login com MFA, CSRF
// ============================================================

const API_BASE_URL = 'php/login_refeito.php';
const appState = { csrfToken: null };

// ============================================================
// 1. INTERFACE (NAVBAR, SIDEBAR, CARRINHO)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
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

    limparCarrinhoBtn?.addEventListener('click', function () {
        localStorage.removeItem('cartCount');
        localStorage.removeItem('cartItems');
        atualizarCarrinho();
        if (typeof renderizarCarrinho === 'function') renderizarCarrinho();
        cartMenu?.classList.remove('show');
        alert('Carrinho limpo com sucesso!');
    });

    avatar?.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown?.classList.toggle('active');
    });

    genresBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        genresDropdown?.classList.toggle('active');
        genresArrow?.classList.toggle('rotate');
        if (sidebar && !sidebar.classList.contains('active')) {
            sidebar.classList.add('active');
        }
    });

    barsIcon?.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar?.classList.toggle('active');
    });

    cartIcon?.addEventListener('click', (e) => {
        e.stopPropagation();
        cartMenu?.classList.toggle('show');
        atualizarCarrinho();
    });

    voltarBtn?.addEventListener('click', () => {
        window.location.href = document.referrer;
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sidebar') && !e.target.closest('.fa-bars')) {
            userDropdown?.classList.remove('active');
            genresDropdown?.classList.remove('active');
            genresArrow?.classList.remove('rotate');
            cartMenu?.classList.remove('show');
        }
    });

    if (cartIcon) cartIcon.style.marginRight = '20px';
    if (cartCountSpan) {
        cartCountSpan.style.backgroundColor = '#007BFF';
        cartCountSpan.style.color = 'white';
    }

    atualizarCarrinho();
});

// ============================================================
// 2. FUNÇÕES DE LOGIN E AUTENTICAÇÃO
// ============================================================
function getDOMElements() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('senha');
    const mfaInput = document.getElementById('mfa_code');
    const mfaSection = document.getElementById('mfa-section');
    const form = document.getElementById('formlogin');
    const errorMessage = document.getElementById('error-message');
    const loadingSpinner = document.querySelector('.loading-spinner');

    if (!emailInput || !passwordInput || !form) {
        console.warn('❌ Elementos do formulário não encontrados.');
        return null;
    }

    return {
        emailInput,
        passwordInput,
        mfaInput,
        mfaSection,
        form,
        errorMessage,
        loadingSpinner
    };
}


function showAlert(message, type = 'error') {
    const { errorMessage } = getDOMElements();
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.style.color = type === 'error' ? 'red' : (type === 'info' ? 'blue' : 'green');
    }
}

function hideAlert() {
    const { errorMessage } = getDOMElements();
    if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }
}

function setLoadingState(isLoading) {
    const { loadingSpinner } = getDOMElements();
    if (loadingSpinner) {
        loadingSpinner.style.display = isLoading ? 'inline-block' : 'none';
    }
}

// ============================================================
// 3. VALIDAÇÃO DE FORMULÁRIO
// ============================================================
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateForm(email, password) {
    if (!email || !password) {
        showAlert("Preencha todos os campos obrigatórios.", "warning");
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert("Email inválido.", "warning");
        return false;
    }

     // Verifica tamanho da senha
     if (password.length < 12 || password.length > 20) {
        showAlert("A senha deve ter entre 12 e 20 caracteres.", "warning");
        return false;
    }

    // Verifica força da senha
    const uppercase = /[A-Z]/;
    const lowercase = /[a-z]/;
    const number = /[0-9]/;
    const special = /[^A-Za-z0-9]/;

    if (
        !uppercase.test(password) ||
        !lowercase.test(password) ||
        !number.test(password) ||
        !special.test(password)
    ) {
        showAlert(
            "A senha deve conter ao menos: uma letra maiúscula, uma minúscula, um número e um caractere especial.",
            "warning"
        );
        return false;
    }

    return true;
}

  

// ============================================================
// 4. COMUNICAÇÃO COM BACKEND (CSRF + LOGIN)
// ============================================================
async function fetchCsrfToken() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=get_csrf`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        if (!data.success || !data.token) throw new Error('Token inválido');
        return data.token;
    } catch (error) {
        console.error('Erro ao obter CSRF:', error);
        throw error;
    }
}

async function makeApiRequest(action, data = {}) {
    console.log(`🚀 Iniciando makeApiRequest para ação: ${action}`);
    try {
        setLoadingState(true);

        if (!appState.csrfToken && action !== 'get_csrf') {
            console.log("🔐 Buscando CSRF token...");
            appState.csrfToken = await fetchCsrfToken();
        }

        if (appState.csrfToken) {
            data.csrf_token = appState.csrfToken;
        }

        console.log("📦 Dados a enviar:", data);

        const response = await fetch(`${API_BASE_URL}?action=${action}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        console.log("✅ Requisição enviada, aguardando resposta...");

        const responseText = await response.text();
        console.log("📨 Resposta bruta:", responseText);

        if (!responseText) throw new Error('Resposta vazia');

        const result = JSON.parse(responseText);
        if (!response.ok) throw new Error(result.message || 'Erro na requisição');
        return result;

    } catch (error) {
        console.error(`🔥 Erro [${action}]:`, error);
        showAlert(error.message || 'Erro geral', 'error');
        throw error;
    } finally {
        setLoadingState(false);
    }
}


// ============================================================
// 5. LOGIN COM MFA
// ============================================================
async function handleLogin(event) {
    if (event) event.preventDefault();
    console.log("✅ handleLogin chamada");
  
    const elements = getDOMElements();
    if (!elements) {
      console.warn("❌ getDOMElements retornou null");
      return;
    }
  
    const email = elements.emailInput?.value.trim();
    const password = elements.passwordInput?.value;
    const mfaCode = elements.mfaInput?.value.trim();
  
    if (!validateForm(email, password)) {
      console.warn("❌ Formulário inválido");
      return;
    }
  
    const requestData = { email, senha: password };
    if (mfaCode) requestData.mfa_code = mfaCode;
  
    console.log("📦 Enviando:", requestData);
  
    try {
      const response = await makeApiRequest('login', requestData);
      console.log("✅ Resposta do login:", response);
  
        if (response.mfa_required) {
            elements.mfaSection.style.display = 'block';
            showAlert('Digite o código do app autenticador (MFA)', 'info');
            return; // evita redirecionar antes de digitar o código
        }
    
        if (response.success) {
            window.location.href = '/bcs-expcriativa3/perfil.html';

        } else {
            showAlert(response.message || 'Erro de login', 'error');
        }
    
    } catch (error) {
      console.error('🔥 Erro na requisição login:', error);
    }
  }
  

// ============================================================
// 6. INICIALIZAÇÃO
// ============================================================
function setupEventListeners() {
    const elements = getDOMElements();
    console.log("setupEventListeners foi chamado");
    if (!elements || !elements.form) {
        console.log("Formulário não encontrado");
        return;
    }
    elements.form.addEventListener('submit', handleLogin);
    console.log("Evento de submit adicionado");
}

async function initializeApp() {
    console.log("initializeApp foi chamado");
    try {
        setupEventListeners();
        appState.csrfToken = await fetchCsrfToken();
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);


