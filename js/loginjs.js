/**
 * Script de Autenticação com MFA (Multi-Factor Authentication)
 * 
 * Este script implementa a interface de login com autenticação em dois fatores,
 * integrando com a API backend no arquivo login.php
 */

// ==============================================
// CONFIGURAÇÕES GLOBAIS E CONSTANTES
// ==============================================

//Verificação de token CSRF
console.log('Inicializando aplicação... Verificando token CSRF');

// URL base da API
const API_BASE_URL = window.location.origin + '/php/login.php';

// Adicione este log para verificar
console.log('URL da API:', API_BASE_URL);

// Estados da aplicação
const AuthStates = {
    LOGIN: 'login',
    MFA_SETUP: 'mfa_setup',
    MFA_VERIFY: 'mfa_verify'
};

// Elementos do DOM
const elements = {
    loginForm: document.getElementById('formlogin'),
    mfaSetupSection: document.getElementById('mfa-setup'),
    mfaVerifySection: document.getElementById('mfa-verification'),
    mfaStatus: document.getElementById('mfaStatus'),
    enableMfaBtn: document.getElementById('enableMfaBtn'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('senha'),
    mfaCodeInput: document.getElementById('mfa-code'),
    mfaSetupCodeInput: document.getElementById('mfa-setup-code'),
    mfaQrCode: document.getElementById('mfa-qrcode'),
    mfaSecret: document.getElementById('mfa-secret'),
    remainingAttempts: document.getElementById('tentativas-restantes'),
    verifyMfaBtn: document.getElementById('verify-mfa'),
    confirmMfaSetupBtn: document.getElementById('confirm-mfa-setup'),
    mfaTimeout: document.getElementById('mfa-timeout')
};

// Estado da aplicação
const appState = {
    currentState: AuthStates.LOGIN,
    mfaToken: null,
    remainingAttempts: 3,
    csrfToken: null,
    userData: null,
    mfaEnabled: document.getElementById('mfaStatusText')?.textContent === 'Ativada'
};

// ==============================================
// FUNÇÕES UTILITÁRIAS
// ==============================================

/**
 * Exibe um alerta na tela
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de alerta (success, error, etc.)
 */
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease forwards';
        alertDiv.addEventListener('animationend', () => {
            alertDiv.remove();
        });
    }, 5000);
}

/**
 * Mostra/Oculta um loader
 * @param {boolean} show - Se true, mostra o loader
 */
function toggleLoader(show = true) {
    const loader = document.querySelector('.loader');
    if (show) {
        if (!loader) {
            const newLoader = document.createElement('div');
            newLoader.className = 'loader';
            document.body.appendChild(newLoader);
        }
    } else if (loader) {
        loader.remove();
    }
}

/**
 * Faz uma requisição para a API
 * @param {string} action - Ação a ser executada
 * @param {object} data - Dados a serem enviados
 */
async function makeRequest(action, data = {}) {

    // Verificação reforçada do token
     if (!appState.csrfToken) {
        console.error('Token CSRF não disponível na requisição');
        await fetchCsrfToken();
        if (!appState.csrfToken) {
            showAlert('Erro de segurança. Recarregando...', 'error');
            window.location.reload();
            return;
        }
    }

    try {
        
        toggleLoader(true);
        
        console.log('Enviando para:', API_BASE_URL, 'Ação:', action, 'Dados:', data)

        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': appState.csrfToken
            },
            body: JSON.stringify({ 
                ...data, 
                action,
                csrf_token: appState.csrfToken
            })
        });

        // Adicione este log para debug
        console.log('Resposta bruta:', response);
        console.log('Resposta da API:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url
        });

        // Verificar se a resposta é JSON válido
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Resposta não é JSON válido');
        }

        const responseData = await response.json();

        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            
            if (errorData?.requires_reload) {
                window.location.reload();
                return;
            }
            
            throw new Error(errorData?.message || `Erro HTTP: ${response.status}`);
        }
        
        // Tratamento especial para erros CSRF
        if (response.status === 403) {
            const errorData = await response.json();
            if (errorData.message.includes('CSRF')) {
                console.warn('Token CSRF inválido ou expirado, obtendo novo...');
                await fetchCsrfToken();
                return makeRequest(action, data); // Retry
            }
        }

        // Verificação adicional de estrutura de resposta
        if (!responseData) {
            throw new Error('Resposta inválida do servidor');
        }
        
        return responseData;

    } catch (error) {
        console.error('Erro completo:', error);

        console.error('Detalhes do erro:', {
            error: error.message,
            config: {
                url: API_BASE_URL,
                method: 'POST',
                body: JSON.stringify({...data, action})
            }
        });

        showAlert('Erro na comunicação com o servidor', 'error');
        throw error;
    } finally {
        toggleLoader(false);
    }
}

/**
 * Atualiza a interface com base no estado atual
 */

function updateUI() {
    console.log('Atualizando UI, estado atual:', appState.currentState); // DEBUG
    
    // Esconde todas as seções primeiro
    elements.mfaSetupSection.style.display = 'none';
    elements.mfaVerifySection.style.display = 'none';
    
    // Mostra a seção apropriada
    switch(appState.currentState) {
        case AuthStates.MFA_SETUP:
            console.log('Mostrando seção MFA_SETUP'); // DEBUG
            elements.mfaSetupSection.style.display = 'block';
            elements.mfaSetupSection.classList.add('active');
            break;

        case AuthStates.MFA_VERIFY:
            console.log('Mostrando seção MFA_VERIFY'); // DEBUG
            elements.mfaVerifySection.style.display = 'block';
            elements.mfaVerifySection.classList.add('active');
            elements.remainingAttempts.textContent = 
                `Tentativas restantes: ${appState.remainingAttempts}`;
            break;
    }
    
    // Atualiza o status do MFA
    if (elements.mfaStatusText) {
        const status = appState.mfaEnabled ? 'enabled' : 'disabled';
        console.log('Atualizando status MFA:', status); // DEBUG
        elements.mfaStatusText.textContent = status === 'enabled' ? 'Ativada' : 'Desativada';
        elements.mfaStatusText.dataset.status = status;
    }
}

// ==============================================
// MANIPULAÇÃO DE AUTENTICAÇÃO
// ==============================================


//Validação do formulário

// Adicionar validação antes do submit
function validateLoginForm() {
    const email = elements.emailInput.value.trim();
    const senha = elements.passwordInput.value;
    
    if (!email || !senha) {
        showAlert('Por favor, preencha todos os campos', 'error');
        return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAlert('Por favor, insira um email válido', 'error');
        return false;
    }
    
    return true;
}



/**
 * Manipula o login do usuário
 */
async function handleLogin() {

    console.log('Iniciando handleLogin'); // DEBUG

    if (!validateLoginForm()) return;

    const email = elements.emailInput.value.trim();
    const senha = elements.passwordInput.value;

    console.log('Credenciais:', {email, senha}); // DEBUG


    if (!email || !senha) {
        showAlert('Por favor, preencha todos os campos', 'error');
        return;
    }

    try {
        console.log('Fazendo requisição para API...'); // DEBUG
        const data = await makeRequest('login', { email, senha });
        console.log('Resposta da API:', data); // DEBUG
        
        if (data.success) {
            console.log('Login bem-sucedido, ocultando formulário...'); // DEBUG
            document.getElementById('basiclogin').style.display = 'none';
            
            console.log('Exibindo seção pós-login...'); // DEBUG
            document.getElementById('post-login').style.display = 'block';

            if (data.mfa_setup_required) {
                console.log('MFA setup required'); // DEBUG
                appState.currentState = AuthStates.MFA_SETUP;
                appState.userData = { email, userId: data.user_id };
                startMfaSetup();
            } else if (data.mfa_required) {
                console.log('MFA verification required'); // DEBUG
                appState.currentState = AuthStates.MFA_VERIFY;
                appState.mfaToken = data.mfa_token;
                appState.userData = { email };
            } else {
                console.log('Redirecionando para perfil...'); // DEBUG
                window.location.href = data.redirect || 'perfil.html';
            }
            updateUI();
        } else {
            console.log('Erro no login:', data.message); // DEBUG
            showAlert(data.message || 'Erro no login', 'error');
        }
    } catch (error) {
        console.error('Erro no handleLogin:', error); // DEBUG
        showAlert('Erro na comunicação com o servidor', 'error');
    }
}


// Testar a conexão com a API
async function testApiConnection() {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': appState.csrfToken
            },
            body: JSON.stringify({
                action: 'test',
                csrf_token: appState.csrfToken
            })
        });
        
        const data = await response.json();
        console.log('Teste de conexão com API:', data);
        return data.success === true;
    } catch (error) {
        console.error('Falha no teste de conexão com API:', error);
        return false;
    }
}


// ==============================================
// MFA IMPLEMENTAÇÃO COMPLETA
// ==============================================

/**
 * Inicia o setup do MFA
 */
async function startMfaSetup() {
    try {
        // Mostra a seção de setup primeiro
        appState.currentState = AuthStates.MFA_SETUP;
        updateUI();
        
        const response = await makeRequest('setup_mfa', {
            email: appState.userData.email,
            user_id: appState.userData.userId
        });

        if (response.success) {
            // Atualiza os elementos da UI
            elements.mfaQrCode.src = response.qr_code;
            elements.mfaSecret.textContent = response.secret;
            appState.mfaSecret = response.secret;
            
            // Garante que os elementos estão visíveis
            elements.mfaQrCode.style.display = 'block';
            elements.mfaSecret.style.display = 'block';
            
            // Foca no campo de código
            elements.mfaSetupCodeInput.focus();
        } else {
            throw new Error(response.message || 'Erro ao configurar MFA');
        }
    } catch (error) {
        console.error('Erro no setup MFA:', error);
        showAlert('Falha na configuração: ' + error.message, 'error');
        resetToLogin();
    }
}

/**
 * Verifica um código MFA
 */
async function verifyMfa() {
    const code = elements.mfaCodeInput.value.trim();
    
    if (!/^\d{6}$/.test(code)) {
        showAlert('Código deve ter 6 dígitos', 'error');
        return;
    }

    try {
        const response = await makeRequest('verify_mfa', {
            mfa_token: appState.mfaToken,
            code: code
        });

        if (response.success) {
            showAlert('Autenticação concluída!', 'success');
            window.location.href = response.redirect || 'perfil.html';
        } else {
            handleFailedAttempt(response);
        }
    } catch (error) {
        console.error('Erro na verificação MFA:', error);
        showAlert('Falha na verificação: ' + error.message, 'error');
    }
}

/**
 * Confirma a ativação do MFA
 */
async function confirmMfaSetup() {
    const code = elements.mfaSetupCodeInput.value.trim();
    
    if (!/^\d{6}$/.test(code)) {
        showAlert('Código deve ter 6 dígitos', 'error');
        return;
    }

    try {
        const response = await makeRequest('confirm_mfa', {
            code: code,
            secret: appState.mfaSecret,
            user_id: appState.userData.userId
        });

        if (response.success) {
            showAlert('MFA ativado com sucesso!', 'success');
            appState.mfaEnabled = true;
            updateUI();
            setTimeout(() => {
                window.location.href = response.redirect || 'perfil.html';
            }, 1500);
        } else {
            throw new Error(response.message || 'Código inválido');
        }
    } catch (error) {
        console.error('Erro na confirmação MFA:', error);
        showAlert('Falha na ativação: ' + error.message, 'error');
    }
}

/**
 * Ativa o MFA para usuário logado
 */
async function enableMfaForUser() {
    if (!appState.userData?.email) {
        showAlert('Faça login primeiro', 'error');
        return;
    }

    try {
        const response = await makeRequest('setup_mfa', {
            email: appState.userData.email,
            user_id: appState.userData.userId
        });

        if (response.success) {
            appState.currentState = AuthStates.MFA_SETUP;
            elements.mfaQrCode.src = response.qr_code;
            elements.mfaSecret.textContent = response.secret;
            appState.mfaSecret = response.secret;
            updateUI();
        } else {
            throw new Error(response.message || 'Erro ao ativar MFA');
        }
    } catch (error) {
        console.error('Erro ao ativar MFA:', error);
        showAlert('Falha: ' + error.message, 'error');
    }
}

// Helper functions
function handleFailedAttempt(response) {
    appState.remainingAttempts--;
    elements.remainingAttempts.textContent = `Tentativas restantes: ${appState.remainingAttempts}`;
    
    if (appState.remainingAttempts <= 0) {
        showAlert('Tentativas esgotadas', 'error');
        resetToLogin();
    } else {
        showAlert(response.message || 'Código inválido', 'error');
    }
}

function resetToLogin() {
    appState.currentState = AuthStates.LOGIN;
    appState.remainingAttempts = 3;
    updateUI();
}


// ==============================================
// CONFIGURAÇÃO DE EVENTOS
// ==============================================

//**
/* Configura os dropdowns da navbar e sidebar
*/
// Atualize a função setupDropdowns para ser mais robusta
function setupDropdowns() {
    // Dropdown do avatar (navbar)
    const avatar = document.querySelector(".avatar");
    if (avatar) {
        avatar.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const menu = this.querySelector(".dropdown-menu");
            if (menu) {
                menu.classList.toggle("active");

                // Fecha outros menus abertos
                document.querySelectorAll(".dropdown-menu").forEach(d => {
                    if (d !== menu) d.classList.remove("active");
                });
            }
        });
    }

    // Dropdown dos gêneros (sidebar)
    const dropdownBtn = document.querySelector(".sidebar .dropdown-btn");
    if (dropdownBtn) {
        dropdownBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            this.classList.toggle("active");
            
            const dropdownContent = this.nextElementSibling;
            if (dropdownContent && dropdownContent.classList.contains("dropdown-container")) {
                dropdownContent.classList.toggle("active");
                
                const icon = this.querySelector(".fa-caret-down");
                if (icon) {
                    icon.classList.toggle("fa-rotate-180");
                }
            }
        });
    }

    // Fecha todos os dropdowns ao clicar fora
    document.addEventListener("click", function(e) {
        // Verifica se o clique foi fora dos dropdowns
        if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-btn')) {
            document.querySelectorAll(".dropdown-menu").forEach(dropdown => {
                dropdown.classList.remove("active");
            });
            
            document.querySelectorAll(".sidebar .dropdown-container").forEach(dropdown => {
                dropdown.classList.remove("active");
            });
            
            document.querySelectorAll(".sidebar .dropdown-btn").forEach(btn => {
                btn.classList.remove("active");
                const icon = btn.querySelector(".fa-caret-down");
                if (icon) icon.classList.remove("fa-rotate-180");
            });
        }
    });

    // Toggle da sidebar em mobile
    const bars = document.querySelector(".bars");
    if (bars) {
        bars.addEventListener("click", function(e) {
            e.stopPropagation();
            const sidebar = document.querySelector(".sidebar");
            if (sidebar) {
                sidebar.classList.toggle("active");
            }
        });
    }
}

/**
 * Configura todos os eventos da aplicação
 */
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Formulário de login
    if (elements.loginForm) {
        let isSubmitting = false;
        elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (isSubmitting) return;
            
            isSubmitting = true;
            handleLogin().finally(() => {
                isSubmitting = false;
            });
        });
    }

    // Botão de ativar MFA
    elements.enableMfaBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        enableMfaForUser();
    });

    // Confirmação de setup MFA
    elements.confirmMfaSetupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        confirmMfaSetup();
    });

    // Verificação de código MFA
    elements.verifyMfaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        verifyMfa();
    });

    // Configura dropdowns
    setupDropdowns();
}

// ==============================================
// INICIALIZAÇÃO
// ==============================================

document.addEventListener('DOMContentLoaded', () => {

    // Método 1: Tenta obter da meta tag
    const csrfMetaTag = document.querySelector('meta[name="csrf-token"]');
    
    // Método 2: Fallback - tenta obter de um input hidden (adicione no HTML se necessário)
    const csrfInput = document.querySelector('input[name="csrf_token"]');
    
    // Método 3: Fallback - tenta obter da sessão via endpoint especial
    if (!csrfMetaTag?.content && !csrfInput?.value) {
        fetchCsrfToken();
        return;
    }

    // Verifique se o token CSRF existe
    appState.csrfToken = csrfMetaTag?.content || csrfInput?.value;
    console.log('Token CSRF inicializado:', appState.csrfToken);
    
    if (!appState.csrfToken) {
        console.error('Token CSRF não encontrado');
        showAlert('Erro de segurança. Recarregue a página.', 'error');
        return;
    } else {
        console.log('Token CSRF encontrado:', appState.csrfToken);
        setupEventListeners();
        updateUI();
    }

});

// função para buscar o token se não estiver na página
async function fetchCsrfToken() {

    console.log('Solicitando novo token CSRF do servidor...');
    
    try {
        const response = await fetch(`${API_BASE_URL}?action=get_csrf`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Resposta não é JSON válido');
        }
        
        const data = await response.json();
        if (!data.token) {
            throw new Error('Token CSRF não recebido');
        }
        
        appState.csrfToken = data.token;
        console.log('Token CSRF obtido via API:', appState.csrfToken);
        
    } catch (error) {
        console.error('Erro ao buscar token CSRF:', error);
        showAlert('Erro crítico de segurança. Recarregando...', 'error');
        setTimeout(() => window.location.reload(), 3000);
    }

   
}

//Responsividade do sidebar para mobile

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const dropdownBtns = document.querySelectorAll('.dropdown-btn');
    
    // Toggle para mobile
    document.querySelector('.bars').addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });
    
    // Melhorar dropdown para mobile
    dropdownBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                this.classList.toggle('active');
                const dropdownContent = this.nextElementSibling;
                dropdownContent.classList.toggle('active');
            }
        });
    });
});