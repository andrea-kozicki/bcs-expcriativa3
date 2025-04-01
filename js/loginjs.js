/* Inicio Dropdown Navbar */
let dropdownContainer = document.querySelector(".dropdown-container");
let avatar = document.querySelector(".avatar");

dropMenu(avatar);
dropMenu(dropdownContainer);

function dropMenu(selector) {
    //console.log(selector);
    selector.addEventListener("click", () => {
        let dropdownMenu = selector.querySelector(".dropdown-menu");
        dropdownMenu.classList.contains("active") ? dropdownMenu.classList.remove("active") : dropdownMenu.classList.add("active");
    });
}
/* Fim Dropdown Navbar */

/* Inicio Sidebar Toggle / bars */
let sidebar = document.querySelector(".sidebar");
let bars = document.querySelector(".bars");

bars.addEventListener("click", () => {
    sidebar.classList.contains("active") ? sidebar.classList.remove("active") : sidebar.classList.add("active");
});

window.matchMedia("(max-width: 768px)").matches ? sidebar.classList.remove("active") : sidebar.classList.add("active");
/* Fim Sidebar Toggle / bars */

function actionDropdown(id) {
    closeDropdownAction();
    document.getElementById("actionDropdown" + id).classList.toggle("show-dropdown-action");
}

window.onclick = function (event) {
    if (!event.target.matches(".dropdown-btn-action")) {
        /*document.getElementById("actionDropdown").classList.remove("show-dropdown-action");*/
        closeDropdownAction();
    }
}

function closeDropdownAction() {
    var dropdowns = document.getElementsByClassName("dropdown-action-item");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i]
        if (openDropdown.classList.contains("show-dropdown-action")) {
            openDropdown.classList.remove("show-dropdown-action");
        }
    }
}


/* Inicio dropdown sidebar */

var dropdownSidebar = document.getElementsByClassName("dropdown-btn");
var i;

for (i = 0; i < dropdownSidebar.length; i++) {
    dropdownSidebar[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var dropdownContent = this.nextElementSibling;
        if (dropdownContent.style.display === "block") {
            dropdownContent.style.display = "none";
        } else {
            dropdownContent.style.display = "block";
        }
    });
}
/* Fim dropdown sidebar */


/* Inicio validação campo de login */

/* função para validar o email usando regex */
function validacaoEmailRegex(email) {

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/* função unificada para sanitizar login e senha */

function sanitizeInput(input) {
    return input.trim()
               .replace(/</g, "&lt;").replace(/>/g, "&gt;")// Impede XSS
               .replace(/'/g, "&#39;").replace(/"/g, "&#34;");//Impede SQL Injection
}

/* validação do login */
document.addEventListener('DOMContentLoaded', function() {
    // Obter CSRF token
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    
    // Elementos da interface
    const loginForm = document.getElementById('formlogin');
    const mfaSection = document.getElementById('mfaVerification');
    const mfaForm = document.getElementById('formMFA');
    const backupForm = document.getElementById('backupCodeForm');
    const mfaMessage = document.getElementById('mfaMessage');
    
    // Estado da aplicação
    let mfaState = {
        token: null,
        email: null,
        remainingAttempts: 3
    };

 // Login tradicional
    loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = sanitizeInput(document.getElementById('email').value);
    const senha = document.getElementById('senha').value; // Hash será feito no backend
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Por favor, insira um e-mail válido.');
            return;
        }

        if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{12,}$/.test(senha)) {
            alert('A senha deve conter pelo menos 8 caracteres alfanuméricos.');
            return;
        }
    
        try {
            const response = await fetch('login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    senha: senha
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.mfa_required) {
                    // Mostrar interface MFA
                    mfaState.token = data.mfa_token;
                    mfaState.email = email;
                    loginForm.style.display = 'none';
                    mfaSection.style.display = 'block';
                    mfaMessage.textContent = 'Insira o código do seu aplicativo autenticador';
                } else {
                    // Login sem MFA
                    window.location.href = 'dashboard.php';
                }
            } else {
                showError(data.message || 'Erro no login');
            }
        } catch (error) {
            showError('Erro na comunicação com o servidor');
        }
    });
/* fim validação do login */


    /*usando a biblioteca bcrypt */
if(validacaoSenha(senha)){    

    const senhaSantitizada = sanitizePassword(senha);
    const salt = bcrypt.genSaltSync(10); 
    const hashedPassword = bcrypt.hashSync(senhaSantitizada, salt);
    console.log("Hash da senha: ", hashedPassword);

    fetch('/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: hashedPassword }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Resposta do servidor:', data);
    })
    .catch(error => {
        console.error('Erro ao enviar dados:', error);
    });
    } else {
    console.log("Senha inválida. A senha deve ter pelo menos 8 caracteres, incluindo letras e números.");
    }


/* fim biblioteca bcrypt */

// Verificação MFA
mfaForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const code = document.getElementById('mfaCode').value;
    
    if (!/^\d{6}$/.test(code)) {
        showError('Código deve ter 6 dígitos');
        return;
    }
    
    try {
        const response = await fetch('login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                action: 'verify_mfa',
                mfa_token: mfaState.token,
                code: code
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = 'dashboard.php';
        } else {
            mfaState.remainingAttempts--;
            if (mfaState.remainingAttempts > 0) {
                showError(`Código inválido. ${mfaState.remainingAttempts} tentativas restantes.`);
            } else {
                showError('Número máximo de tentativas excedido. Por favor, use um código de backup.');
                mfaForm.style.display = 'none';
                backupForm.style.display = 'block';
            }
        }
    } catch (error) {
        showError('Erro ao verificar código');
    }
});

// Funções auxiliares
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    mfaMessage.innerHTML = '';
    mfaMessage.appendChild(errorElement);
}

function sanitizeInput(input) {
    return input.trim()
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;').replace(/"/g, '&#34;');
}
});

// MFA Implementation
document.addEventListener('DOMContentLoaded', function() {
    const formLogin = document.getElementById('formlogin');
    const formMFA = document.getElementById('formMFA');
    const backToLogin = document.getElementById('backToLogin');
    
    let mfaToken = null;
    let currentEmail = null;

    // Login Form Submission
    if (formLogin) {
        formLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            
            try {
                const response = await fetch('login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'login',
                        email: email,
                        senha: senha
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    if (data.mfa_required) {
                        // Mostrar etapa MFA
                        currentEmail = email;
                        mfaToken = data.mfa_token;
                        document.getElementById('basiclogin').style.display = 'none';
                        document.getElementById('mfaVerification').style.display = 'block';
                    } else {
                        // Login sem MFA
                        window.location.href = 'index.html';
                    }
                } else {
                    alert(data.message || 'Login falhou');
                }
            } catch (error) {
                console.error('Erro ao processar login:', error);
                alert('Erro ao processar login. Tente novamente.');
            }
        });
    }
    
    // MFA Form Submission
    if (formMFA) {
        formMFA.addEventListener('submit', async function(e) {
            e.preventDefault();
            const mfaCode = document.getElementById('mfaCode').value;
            
            try {
                const response = await fetch('login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'verify_mfa',
                        mfa_token: mfaToken,
                        code: mfaCode
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = 'index.html';
                } else {
                    alert(data.message || 'Código inválido');
                }
            } catch (error) {
                console.error('Erro ao verificar MFA:', error);
                alert('Erro ao verificar código. Tente novamente.');
            }
        });
    }
    
    // Back to Login Button
    if (backToLogin) {
        backToLogin.addEventListener('click', function() {
            document.getElementById('basiclogin').style.display = 'block';
            document.getElementById('mfaVerification').style.display = 'none';
        });
    }
    
    // MFA Setup Functionality (to be called from user profile page)
    window.setupMFA = async function(email) {
        try {
            // Step 1: Get MFA secret and QR code
            const response = await fetch('login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'setup_mfa',
                    email: email
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Show QR code and manual entry code
                document.getElementById('qrCodeContainer').innerHTML = `<img src="${data.qr_code}" alt="QR Code">`;
                document.getElementById('manualCode').textContent = data.secret;
                
                // Show setup modal
                document.getElementById('mfaSetupModal').style.display = 'block';
                
                // Verify button handler
                document.getElementById('verifySetupCode').onclick = async function() {
                    const code = document.getElementById('setupCode').value;
                    
                    const verifyResponse = await fetch('login.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            action: 'confirm_mfa',
                            email: email,
                            code: code
                        })
                    });
                    
                    const verifyData = await verifyResponse.json();
                    
                    if (verifyData.success) {
                        // Show backup codes
                        document.getElementById('mfaSetupStep1').style.display = 'none';
                        document.getElementById('mfaSetupStep2').style.display = 'block';
                        
                        const backupCodesHTML = verifyData.backup_codes.map(code => 
                            `<div class="backup-code">${code}</div>`
                        ).join('');
                        
                        document.getElementById('backupCodes').innerHTML = backupCodesHTML;
                    } else {
                        alert(verifyData.message || 'Código inválido');
                    }
                };
                
                // Finish button handler
                document.getElementById('finishMfaSetup').onclick = function() {
                    document.getElementById('mfaSetupModal').style.display = 'none';
                    alert('MFA configurado com sucesso!');
                };
            } else {
                alert(data.message || 'Erro ao configurar MFA');
            }
        } catch (error) {
            console.error('Erro ao configurar MFA:', error);
            alert('Erro ao configurar MFA. Tente novamente.');
        }
    };
    
    // Close modal button
    document.querySelector('.close').onclick = function() {
        document.getElementById('mfaSetupModal').style.display = 'none';
    };
});

// Adicionar CSRF token
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
}

// Adicione este código na seção de MFA Implementation

document.getElementById('enableMfaBtn').addEventListener('click', function() {
    // Obter email do usuário logado (em uma aplicação real, você obteria da sessão)
    const userEmail = document.getElementById('email').value;
    
    if (!userEmail) {
        alert('Por favor, faça login primeiro');
        return;
    }

    // Chamar a função de setup MFA
    setupMFA(userEmail);
});

// Atualize a função showMFAVerification para mostrar o status
function updateMFAStatus(enabled) {
    const statusElement = document.getElementById('mfaStatus');
    if (enabled) {
        statusElement.innerHTML = 'Autenticação em Dois Fatores: <strong>Ativada</strong>';
        document.getElementById('enableMfaBtn').textContent = 'Gerenciar Autenticação em Dois Fatores';
    } else {
        statusElement.innerHTML = 'Autenticação em Dois Fatores: <strong>Desativada</strong>';
        document.getElementById('enableMfaBtn').textContent = 'Ativar Autenticação em Dois Fatores';
    }
}

// Chame esta função quando o usuário fizer login
function onLoginSuccess() {
    // Verificar status do MFA (você precisaria adicionar isso na resposta de login)
    updateMFAStatus(false); // Ou true, dependendo do status do usuário
}

// Modifique a função de login para verificar o status do MFA após login
document.getElementById('formlogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = sanitizeInput(document.getElementById('email').value);
    const senha = document.getElementById('senha').value;
    
    try {
        const response = await fetch('login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: email,
                senha: senha
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.mfa_required) {
                showMFAVerification(data.mfa_token);
            } else {
                // Verificar status do MFA após login
                const statusResponse = await fetch('login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'check_mfa_status',
                        email: email
                    })
                });
                
                const statusData = await statusResponse.json();
                updateMFAStatus(statusData.mfa_enabled);
                
                window.location.href = 'index.html';
            }
        } else {
            alert(data.message || 'Erro no login');
        }
    } catch (error) {
        alert('Erro na comunicação com o servidor');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const toggleMfaBtn = document.getElementById('toggleMfaBtn');
    const mfaStatus = document.getElementById('mfaStatus');
    let mfaEnabled = false;

    // Verificar status atual do MFA
    checkMfaStatus();

    // Configurar o botão
    toggleMfaBtn.addEventListener('click', async function() {
        try {
            const response = await fetch('mfa_control.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    action: 'toggle_mfa',
                    enable: !mfaEnabled
                })
            });

            const data = await response.json();
            
            if (data.success) {
                mfaEnabled = !mfaEnabled;
                updateMfaStatus();
                if (mfaEnabled) {
                    showMfaSetupModal(data.secret, data.qr_code);
                }
            } else {
                alert(data.message || 'Erro ao alterar status do MFA');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro na comunicação com o servidor');
        }
    });

    async function checkMfaStatus() {
        try {
            const response = await fetch('mfa_control.php?action=check_status');
            const data = await response.json();
            mfaEnabled = data.mfa_enabled;
            updateMfaStatus();
        } catch (error) {
            console.error('Erro ao verificar status:', error);
        }
    }

    function updateMfaStatus() {
        if (mfaEnabled) {
            mfaStatus.innerHTML = 'Status: <span style="color:green;">Ativado</span>';
            toggleMfaBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Desativar MFA';
            toggleMfaBtn.style.backgroundColor = '#dc3545';
        } else {
            mfaStatus.innerHTML = 'Status: <span style="color:red;">Desativado</span>';
            toggleMfaBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Ativar MFA';
            toggleMfaBtn.style.backgroundColor = '#17a2b8';
        }
    }
});