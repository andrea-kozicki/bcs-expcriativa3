/**
 * Script de Autenticação com MFA (Multi-Factor Authentication)
 * 
 * Este script implementa a interface de login com autenticação em dois fatores,
 * integrando com a API backend no arquivo login.php
 */

// ==============================================
// CONFIGURAÇÕES GLOBAIS E CONSTANTES
// ==============================================

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
    csrfToken: document.querySelector('meta[name="csrf-token"]')?.content,
    userData: null
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
    
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
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
        console.log('Resposta da API:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url
        });


        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Verificação adicional de estrutura de resposta
        if (!responseData || typeof responseData.success === 'undefined') {
            throw new Error('Resposta inválida do servidor');
        }
        
        return responseData;
    } catch (error) {
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
    // Esconde todas as seções primeiro
    elements.loginForm.closest('.content-adm').style.display = 'block';
    elements.mfaSetupSection.style.display = 'none';
    elements.mfaVerifySection.style.display = 'none';

    // Mostra a seção apropriada
    switch(appState.currentState) {
        case AuthStates.LOGIN:
            elements.loginForm.closest('.content-adm').style.display = 'block';
            break;
        case AuthStates.MFA_SETUP:
            elements.mfaSetupSection.style.display = 'block';
            break;
        case AuthStates.MFA_VERIFY:
            elements.mfaVerifySection.style.display = 'block';
            elements.remainingAttempts.textContent = 
                `Tentativas restantes: ${appState.remainingAttempts}`;
            break;
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
                appState.userData = { email, userId: data.user_id };
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
        // Adicionado user_id que é esperado pelo backend
        const data = await makeRequest('setup_mfa', {
            email: appState.userData.email,
            user_id: appState.userData.userId
        });
        
        if (data.success) {
            // Verificação de campos obrigatórios na resposta
            if (!data.qr_code || !data.secret) {
                throw new Error('Dados MFA incompletos na resposta');
            }
            
            elements.mfaQrCode.src = data.qr_code;
            elements.mfaSecret.textContent = data.secret;
            
            // Armazena temporariamente o secret no estado
            appState.mfaSecret = data.secret;
        } else {
            showAlert(data.message || 'Erro ao configurar MFA', 'error');
        }
    } catch (error) {
        console.error('Erro no setup MFA:', error);
        showAlert('Falha na configuração do MFA', 'error');
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
        // Adicionado secret que é necessário para verificação no backend
        const data = await makeRequest('confirm_mfa', { 
            code,
            secret: appState.mfaSecret,
            user_id: appState.userData.userId
        });
        
        if (data.success) {
            showAlert('MFA configurado com sucesso!', 'success');
            window.location.href = 'perfil.html';
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

    try {
        const data = await makeRequest('setup_mfa', { email });
        
        if (data.success) {
            appState.currentState = AuthStates.MFA_SETUP;
            appState.userData = { email };
            elements.mfaQrCode.src = data.qr_code;
            elements.mfaSecret.textContent = data.secret;
            updateUI();
        } else {
            showAlert(data.message || 'Erro ao configurar MFA', 'error');
        }
    } catch (error) {
        showAlert('Erro na comunicação com o servidor', 'error');
    }
}

// ==============================================
// CONFIGURAÇÃO DE EVENTOS
// ==============================================

//**
/* Configura os dropdowns da navbar e sidebar
*/
function setupDropdowns() {
   // Dropdown do avatar (navbar)
   document.querySelector(".avatar")?.addEventListener("click", function(e) {
       e.stopPropagation();
       this.querySelector(".dropdown-menu")?.classList.toggle("active");
   });

   // Dropdown dos gêneros (sidebar) - CORREÇÃO PRINCIPAL
   const dropdownBtn = document.querySelector(".sidebar .dropdown-btn");
   if (dropdownBtn) {
       dropdownBtn.addEventListener("click", function(e) {
           e.stopPropagation();
           this.classList.toggle("active");
           
           // Alterna o dropdown container
           const dropdownContent = this.nextElementSibling;
           if (dropdownContent) {
               dropdownContent.classList.toggle("active");
               
               // Alterna o ícone
               const icon = this.querySelector(".fa-caret-down");
               if (icon) {
                   icon.classList.toggle("fa-rotate-180");
               }
           }
       });
   }

   // Fecha todos os dropdowns ao clicar fora
   document.addEventListener("click", function() {
       // Fecha dropdown do avatar
       document.querySelectorAll(".dropdown-menu").forEach(dropdown => {
           dropdown.classList.remove("active");
       });
       
       // Fecha dropdown da sidebar
       document.querySelectorAll(".sidebar .dropdown-container").forEach(dropdown => {
           dropdown.classList.remove("active");
       });
       
       // Remove estado ativo dos botões e reseta ícones
       document.querySelectorAll(".sidebar .dropdown-btn").forEach(btn => {
           btn.classList.remove("active");
           const icon = btn.querySelector(".fa-caret-down");
           if (icon) icon.classList.remove("fa-rotate-180");
       });
   });

   // Toggle da sidebar em mobile
   document.querySelector(".bars")?.addEventListener("click", function(e) {
       e.stopPropagation();
       document.querySelector(".sidebar").classList.toggle("active");
   });
}

/**
 * Configura todos os eventos da aplicação
 */
function setupEventListeners() {
    // Formulário de login
    elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });

    // Botão de ativar MFA
    elements.enableMfaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        enableMfa();
    });

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
    if (!appState.csrfToken) {
        showAlert('Erro de segurança. Recarregue a página.', 'error');
        return;
    }

    setupEventListeners();
    updateUI();
});