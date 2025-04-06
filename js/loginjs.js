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
const API_BASE_URL = window.location.origin + '/bcs-expcriativa3/php/login.php';

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
        alertDiv.remove();
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

    toggleLoader(true);

    console.log('Enviando requisição para:', API_BASE_URL);
    console.log('Dados enviados:', {action, ...data});

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
                csrf_token: appState.csrfToken // Adicionado para consistência com backend
            })
        });

        // Adicione este log para debug

        console.log('Resposta bruta:', response);

        console.log('Resposta da API:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url
        });

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

        const responseData = await response.json();
        
        // Verificação adicional de estrutura de resposta
        if (!responseData || typeof responseData.success === 'undefined') {
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
    } 
}

/**
 * Atualiza a interface com base no estado atual
 */

function updateUI() {
    // Esconde todas as seções primeiro
    document.querySelector('.content-adm').style.display = 'none';
    elements.mfaSetupSection.style.display = 'none';
    elements.mfaVerifySection.style.display = 'none';
    
    // Mostra a seção apropriada
    switch(appState.currentState) {
        case AuthStates.LOGIN:
            document.querySelector('.content-adm').style.display = 'block';
            break;
        case AuthStates.MFA_SETUP:
            elements.mfaSetupSection.style.display = 'block';
            elements.mfaSetupSection.classList.add('active');
            break;
        case AuthStates.MFA_VERIFY:
            elements.mfaVerifySection.style.display = 'block';
            elements.mfaVerifySection.classList.add('active');
            elements.remainingAttempts.textContent = 
                `Tentativas restantes: ${appState.remainingAttempts}`;
            break;
    }
    
    // Atualiza o status do MFA
    if (elements.mfaStatusText) {
        const status = appState.mfaEnabled ? 'enabled' : 'disabled';
        elements.mfaStatusText.textContent = status === 'enabled' ? 'Ativada' : 'Desativada';
        elements.mfaStatusText.dataset.status = status;
    }
}

// ==============================================
// MANIPULAÇÃO DE AUTENTICAÇÃO
// ==============================================

/**
 * Manipula o login do usuário
 */
async function handleLogin() {
    const email = elements.emailInput.value.trim();
    const senha = elements.passwordInput.value;

    if (!email || !senha) {
        showAlert('Por favor, preencha todos os campos', 'error');
        return;
    }

    try {
        const data = await makeRequest('login', { email, senha });
        
        if (data.success) {
            if (data.mfa_setup_required) {
                // Usuário precisa configurar MFA
                appState.currentState = AuthStates.MFA_SETUP;
                appState.userData = { email, 
                    userId: data.user_id
                };
                startMfaSetup();
            } else if (data.mfa_required) {
                // Usuário precisa verificar código MFA
                appState.currentState = AuthStates.MFA_VERIFY;
                appState.mfaToken = data.mfa_token;
                appState.userData = { email };
            } else {
                // Login sem MFA
                window.location.href = data.redirect || 'perfil.html';
            }
            updateUI();
        } else {
            showAlert(data.message || 'Erro no login', 'error');
        }
    } catch (error) {
        showAlert('Erro na comunicação com o servidor', 'error');
    }
}

/**
 * Inicia o processo de configuração do MFA
 */
async function startMfaSetup() {
    try {
        const data = await makeRequest('setup_mfa', {
            email: appState.userData.email,
            user_id: appState.userData.userId,
            action: 'setup_mfa'
        });
        
        if (data.success) {
            if (!data.qr_code || !data.secret) {
                throw new Error('Dados MFA incompletos na resposta');
            }
            
            // Atualiza os elementos do DOM
            elements.mfaQrCode.src = data.qr_code;
            elements.mfaSecret.textContent = data.secret;
            appState.mfaSecret = data.secret;
            
            // Força a exibição dos elementos
            elements.mfaQrCode.style.display = 'block';
            elements.mfaSecret.style.display = 'block';
            
            // Atualiza o estado da UI
            appState.currentState = AuthStates.MFA_SETUP;
            updateUI();
            
            // Foca no campo de código
            elements.mfaSetupCodeInput.focus();
        } else {
            showAlert(data.message || 'Erro ao configurar MFA', 'error');
        }
    } catch (error) {
        console.error('Erro no setup MFA:', error);
        showAlert('Falha na configuração do MFA: ' + error.message, 'error');
    }
}

/**
 * Confirma a configuração do MFA
 */
async function confirmMfaSetup() {
    const code = elements.mfaSetupCodeInput.value.trim();
    
    if (!/^\d{6}$/.test(code)) {
        showAlert('O código deve ter 6 dígitos', 'error');
        return;
    }
    
    try {
        const data = await makeRequest('confirm_mfa', { 
            code,
            secret: appState.mfaSecret,
            user_id: appState.userData.userId
        });
        
        if (data.success) {
            showAlert('MFA configurado com sucesso!', 'success');
            // Atualizar estado local
            appState.mfaEnabled = true;
            updateUI();
            // Redirecionar após pequeno delay
            setTimeout(() => {
                window.location.href = '/bcs-expcriativa3/perfil.html';
            }, 1500);
        } else {
            showAlert(data.message || 'Código inválido', 'error');
        }
    } catch (error) {
        console.error('Erro na confirmação MFA:', error);
        showAlert('Falha ao confirmar MFA', 'error');
    }
}

/**
 * Verifica o código MFA
 */
async function verifyMfaCode() {
    const code = elements.mfaCodeInput.value.trim();
    
    if (!/^\d{6}$/.test(code)) {
        showAlert('O código deve ter 6 dígitos', 'error');
        return;
    }
    
    try {
        const data = await makeRequest('verify_mfa', {
            mfa_token: appState.mfaToken,
            code
        });
        
        if (data.success) {
            showAlert('Autenticação bem-sucedida!', 'success');
            window.location.href = data.redirect || 'perfil.html';
        } else {
            appState.remainingAttempts--;
            updateUI();
            
            if (appState.remainingAttempts <= 0) {
                showAlert('Número máximo de tentativas excedido', 'error');
                appState.currentState = AuthStates.LOGIN;
                updateUI();
            } else {
                showAlert(data.message || 'Código inválido', 'error');
            }
        }
    } catch (error) {
        showAlert('Falha na verificação', 'error');
    }
}

/**
 * Ativa o MFA para um usuário existente
 */
async function enableMfa() {
    const email = elements.emailInput.value.trim();
    
    if (!email) {
        showAlert('Por favor, faça login primeiro', 'error');
        return;
    }

     // Verificar se MFA já está ativado
    if (appState.mfaEnabled) {
        showAlert('Autenticação em dois fatores já está ativada', 'info');
        return;
    }

    try {

        const sessionCheck = await makeRequest('check_session');
        if (!sessionCheck || !sessionCheck.authenticated) {
            showAlert('Por favor, faça login primeiro', 'error');
            return;
        }
        
        appState.userData = {
            email: sessionCheck.email,
            userId: sessionCheck.user_id
        };

        const data = await makeRequest('setup_mfa', { 
            email,
            user_id: appState.userData.userId || null // Envia null se não existir
        });
        
        if (data.success) {
            appState.currentState = AuthStates.MFA_SETUP;
            appState.userData = {
                email: email,
                userId: data.user_id || null
            };
            
            // Atualizar elementos do MFA
            if (data.qr_code && elements.mfaQrCode) {
                elements.mfaQrCode.src = data.qr_code;
            }
            if (data.secret && elements.mfaSecret) {
                elements.mfaSecret.textContent = data.secret;
            }
            
            updateUI();
            showAlert('Escaneie o QR Code ou insira o código manualmente', 'info');
        } else {
            showAlert(data.message || 'Erro ao configurar MFA', 'error');
        }
    } catch (error) {
        console.error('Erro ao ativar MFA:', error);
        showAlert('Erro na comunicação com o servidor', 'error');
    }
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
        avatar.addEventListener("click", function(e) {
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
        elements.loginForm.addEventListener('submit', (e) => {
            console.log('Formulário de login submetido');
            e.preventDefault();
            handleLogin();
        });
    } else {
        console.error('Formulário de login não encontrado');
    }

    // Botão de ativar MFA
    if (elements.enableMfaBtn) {
        elements.enableMfaBtn.addEventListener('click', (e) => {
            console.log('Botão MFA clicado');
            e.preventDefault();
            enableMfa();
        });
    } else {
        console.error('Botão MFA não encontrado');
    }

    // Confirmação de setup MFA
    elements.confirmMfaSetupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        confirmMfaSetup();
    });

    // Verificação de código MFA
    elements.verifyMfaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        verifyMfaCode();
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
    }

    setupEventListeners();
    updateUI()

});

// função para buscar o token se não estiver na página
async function fetchCsrfToken() {

    console.log('Solicitando novo token CSRF do servidor...');
    
    try {
        const response = await fetch(`${API_BASE_URL}?action=get_csrf`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            appState.csrfToken = data.token;
            console.log('Token CSRF obtido via API:', appState.csrfToken);
            setupEventListeners();
            updateUI();
        } else {
            throw new Error('Falha ao obter token CSRF');
        }
    } catch (error) {
        console.error('Erro ao buscar token CSRF:', error);
        showAlert('Erro crítico de segurança. Recarregando...', 'error');
        setTimeout(() => window.location.reload(), 3000);
    }

   
}
