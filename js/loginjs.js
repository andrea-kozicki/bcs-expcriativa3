/**
 * Sistema de Autenticação - Frontend
 * 
 * Principais características:
 * 1. Tratamento robusto de erros
 * 2. Validação de formulário client-side
 * 3. Gerenciamento de estado da aplicação
 * 4. Comunicação segura com a API
 * 5. Feedback visual para o usuário
 * 6. Controle completo dos menus dropdown
 */

// ==============================================
// 1. CONFIGURAÇÕES GLOBAIS
// ==============================================

// URL base da API - usa a mesma origem do frontend
const API_BASE_URL = window.location.origin + '/php/login_refeito.php';

// Estado da aplicação
const appState = {
    csrfToken: null,    // Token CSRF para proteção contra ataques
    isLoading: false,   // Indica se uma operação está em progresso
    dropdowns: {        // Estado dos menus dropdown
        userMenu: false,
        genresMenu: false
    }
};

// ==============================================
// 2. ELEMENTOS DO DOM (COM VERIFICAÇÃO DE SEGURANÇA)
// ==============================================

/**
 * Obtém e valida elementos do DOM necessários
 * @returns {Object|null} Objeto com elementos ou null se não encontrados
 */
function getDOMElements() {
    const loginForm = document.getElementById('formlogin');
    
    if (!loginForm) {
        console.error('Formulário de login não encontrado!');
        return null;
    }
    
    return {
        // Elementos do formulário
        loginForm,
        emailInput: loginForm.querySelector('input[name="email"]'),
        passwordInput: loginForm.querySelector('input[name="senha"]'),
        submitButton: loginForm.querySelector('button[type="submit"]'),
        loadingIndicator: document.getElementById('loading-indicator'),
        
        // Elementos dos dropdowns
        avatarDropdown: document.querySelector('.avatar'),
        userDropdownMenu: document.querySelector('.dropdown-menu.setting'),
        genresDropdownBtn: document.querySelector('.dropdown-btn'),
        genresDropdownContainer: document.querySelector('.dropdown-container'),
        dropdownArrow: document.querySelector('.dropdown-arrow'),
        
        // Elementos do menu hamburguer (sidebar)
        barsIcon: document.querySelector('.fa-bars'),
        sidebar: document.querySelector('.sidebar')
    };
}

// ==============================================
// 3. FUNÇÕES UTILITÁRIAS
// ==============================================

/**
 * Exibe um alerta temporário para o usuário
 * @param {string} message Mensagem a ser exibida
 * @param {string} type Tipo de alerta (success, error, etc.)
 */
function showAlert(message, type = 'success') {
    // Criar elemento do alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Adicionar ao corpo do documento
    document.body.appendChild(alertDiv);
    
    // Remover após 5 segundos com animação
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

/**
 * Atualiza o estado de carregamento da aplicação
 * @param {boolean} isLoading Indica se está carregando
 */
function setLoadingState(isLoading) {
    const elements = getDOMElements();
    if (!elements) return;
    
    // Atualizar estado global
    appState.isLoading = isLoading;
    
    // Mostrar/ocultar indicador de carregamento
    if (elements.loadingIndicator) {
        elements.loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
    
    // Habilitar/desabilitar botão de submit
    if (elements.submitButton) {
        elements.submitButton.disabled = isLoading;
    }
}

// ==============================================
// 4. CONTROLE DOS MENUS DROPDOWN
// ==============================================

/**
 * Alterna o menu dropdown do usuário (avatar)
 */
function toggleUserDropdown() {
    const elements = getDOMElements();
    if (!elements) return;
    
    appState.dropdowns.userMenu = !appState.dropdowns.userMenu;
    
    if (appState.dropdowns.userMenu) {
        elements.userDropdownMenu.classList.add('active');
    } else {
        elements.userDropdownMenu.classList.remove('active');
    }
    
    // Fecha o menu de gêneros se estiver aberto
    if (appState.dropdowns.genresMenu) {
        toggleGenresDropdown();
    }
}

/**
 * Alterna o menu dropdown de gêneros
 */
function toggleGenresDropdown() {
    const elements = getDOMElements();
    if (!elements) return;
    
    appState.dropdowns.genresMenu = !appState.dropdowns.genresMenu;
    
    if (appState.dropdowns.genresMenu) {
        elements.genresDropdownBtn.classList.add('active');
        elements.genresDropdownContainer.classList.add('active');
        elements.dropdownArrow.classList.add('rotate');
    } else {
        elements.genresDropdownBtn.classList.remove('active');
        elements.genresDropdownContainer.classList.remove('active');
        elements.dropdownArrow.classList.remove('rotate');
    }
    
    // Fecha o menu do usuário se estiver aberto
    if (appState.dropdowns.userMenu) {
        toggleUserDropdown();
    }
}

/**
 * Alterna a sidebar (menu lateral)
 */
function toggleSidebar() {
    const elements = getDOMElements();
    if (!elements) return;
    
    elements.sidebar.classList.toggle('active');
}

/**
 * Fecha todos os menus dropdowns
 */
function closeAllDropdowns() {
    const elements = getDOMElements();
    if (!elements) return;
    
    appState.dropdowns.userMenu = false;
    appState.dropdowns.genresMenu = false;
    
    elements.userDropdownMenu.classList.remove('active');
    elements.genresDropdownBtn.classList.remove('active');
    elements.genresDropdownContainer.classList.remove('active');
    elements.dropdownArrow.classList.remove('rotate');
}

/**
 * Configura os event listeners para os dropdowns
 */
function setupDropdownListeners() {
    const elements = getDOMElements();
    if (!elements) return;
    
    // Menu do usuário (avatar)
    if (elements.avatarDropdown) {
        elements.avatarDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleUserDropdown();
        });
    }
    
    // Menu de gêneros
    if (elements.genresDropdownBtn) {
        elements.genresDropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleGenresDropdown();
        });
    }
    
    // Menu hamburguer (sidebar)
    if (elements.barsIcon) {
        elements.barsIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSidebar();
        });
    }
    
    // Fecha menus ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-menu') && 
            !e.target.closest('.avatar') && 
            !e.target.closest('.dropdown-btn') && 
            !e.target.closest('.dropdown-container')) {
            closeAllDropdowns();
        }
    });
}

// ==============================================
// 5. VALIDAÇÃO DE FORMULÁRIO
// ==============================================

/**
 * Valida um endereço de email
 * @param {string} email Email a ser validado
 * @returns {boolean} True se válido, false caso contrário
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Valida os dados do formulário de login
 * @param {string} email Email do usuário
 * @param {string} password Senha do usuário
 * @returns {boolean} True se válido, false caso contrário
 */
function validateForm(email, password) {
    if (!email || !password) {
        showAlert('Por favor, preencha todos os campos', 'error');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showAlert('Por favor, insira um email válido', 'error');
        return false;
    }
    
    return true;
}

// ==============================================
// 6. COMUNICAÇÃO COM A API
// ==============================================

/**
 * Obtém um novo token CSRF do servidor
 * @returns {Promise<string>} Promise que resolve com o token
 */
async function fetchCsrfToken() {
    try {
        // Fazer requisição para obter token
        const response = await fetch(`${API_BASE_URL}?action=get_csrf`, {
            method: 'GET',
            credentials: 'include'  // Inclui cookies para sessão
        });
        
        // Verificar se a resposta está OK
        if (!response.ok) {
            // Tentar extrair mensagem de erro da resposta
            let errorMsg = 'Falha ao obter token de segurança';
            
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMsg = errorData.message;
                }
            } catch (e) {
                console.error('Erro ao analisar resposta:', e);
            }
            
            throw new Error(errorMsg);
        }
        
        // Extrair dados da resposta
        const data = await response.json();
        
        // Verificar estrutura da resposta
        if (!data.success || !data.token) {
            throw new Error('Resposta inválida do servidor');
        }
        
        return data.token;
    } catch (error) {
        console.error('Erro no token CSRF:', error);
        showAlert('Erro ao obter token de segurança. Por favor, recarregue a página.', 'error');
        throw error;
    }
}

/**
 * Faz uma requisição para a API
 * @param {string} action Ação a ser executada
 * @param {Object} data Dados a serem enviados
 * @returns {Promise<Object>} Promise com a resposta da API
 */
async function makeApiRequest(action, data = {}) {
    try {
        // Ativar estado de carregamento
        setLoadingState(true);
        
        // Garantir que temos um token CSRF (exceto para obter o próprio token)
        if (!appState.csrfToken && action !== 'get_csrf') {
            appState.csrfToken = await fetchCsrfToken();
        }
        
        // Adicionar token CSRF se disponível
        if (appState.csrfToken) {
            data.csrf_token = appState.csrfToken;
        }
        
        // Fazer requisição para a API
        const response = await fetch(`${API_BASE_URL}?action=${action}`, {
            method: 'POST',
            credentials: 'include',  // Importante para cookies de sessão
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        // Verificar se a resposta está vazia
        const responseText = await response.text();
        if (!responseText) {
            throw new Error('Resposta vazia do servidor');
        }
        
        // Parse da resposta JSON
        const result = JSON.parse(responseText);
        
        // Verificar se houve erro na requisição
        if (!response.ok) {
            throw new Error(result.message || 'Requisição falhou');
        }
        
        return result;
    } catch (error) {
        console.error(`Erro na requisição (${action}):`, error);
        
        // Mensagem amigável para o usuário
        let userMessage = error.message;
        if (error instanceof SyntaxError) {
            userMessage = 'Resposta inválida do servidor';
        } else if (error.message.includes('Failed to fetch')) {
            userMessage = 'Erro de conexão com o servidor';
        }
        
        showAlert(userMessage, 'error');
        throw error;
    } finally {
        // Desativar estado de carregamento
        setLoadingState(false);
    }
}

// ==============================================
// 7. MANIPULADOR DE LOGIN
// ==============================================

/**
 * Manipula o envio do formulário de login
 * @param {Event} event Evento de submit
 */
async function handleLogin(event) {
    // Prevenir comportamento padrão do formulário
    if (event) {
        event.preventDefault();
    }
    
    // Obter elementos do DOM
    const elements = getDOMElements();
    if (!elements) return;
    
    // Obter valores dos campos
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    
    // Validar formulário
    if (!validateForm(email, password)) {
        return;
    }
    
    try {
        // Fazer requisição de login
        const response = await makeApiRequest('login', {
            email: email,
            senha: password
        });
        
        // Redirecionar com base na resposta
        if (response.success) {
            if (response.mfa_required) {
                window.location.href = `mfa_verification.html?user_id=${response.user_id}`;
            } else {
                window.location.href = 'perfil.html';
            }
        }
    } catch (error) {
        console.error('Erro no processo de login:', error);
    }
}

// ==============================================
// 8. CONFIGURAÇÃO DE EVENT LISTENERS
// ==============================================

/**
 * Configura os event listeners necessários
 */
function setupEventListeners() {
    const elements = getDOMElements();
    if (!elements) return;
    
    // Adicionar listener para o formulário de login
    elements.loginForm.addEventListener('submit', handleLogin);
    
    // Configurar listeners para os dropdowns
    setupDropdownListeners();
}

// ==============================================
// 9. INICIALIZAÇÃO DA APLICAÇÃO
// ==============================================

/**
 * Inicializa a aplicação
 */
async function initializeApp() {
    try {
        // Configurar listeners
        setupEventListeners();
        
        // Obter token CSRF antecipadamente
        appState.csrfToken = await fetchCsrfToken();
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
}

// Iniciar a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);