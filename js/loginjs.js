// Adicione no início do seu loginjs.js
const API_BASE_URL = window.location.origin + '/php/login.php';



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

/* login */

document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    
    if (!csrfToken) {
        console.error('CSRF token não encontrado!');
        showAlert('Erro de segurança. Por favor, recarregue a página.', 'error');
        return;
    }

    const loginForm = document.getElementById('formlogin');
    const mfaSection = document.getElementById('mfaVerification');
    const mfaForm = document.getElementById('formMFA');
    const mfaStatus = document.getElementById('mfaStatus');
    const enableMfaBtn = document.getElementById('enableMfaBtn');
    
    let mfaState = {
        token: null,
        remainingAttempts: 3
    };

    // Login tradicional
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAlert('Por favor, insira um e-mail válido.', 'error');
            return;
        }
    
        try {
            const data = await makeRequest('login', { email, senha });
            
            if (data.success) {
                if (data.mfa_required) {
                    mfaState.token = data.mfa_token;
                    loginForm.style.display = 'none';
                    mfaSection.style.display = 'block';
                } else {
                    window.location.href = 'index.html'; //em substituição ao dashboard.php
                }
            } else {
                showAlert(data.message || 'Erro no login', 'error');
            }
        } catch (error) {
            showAlert('Erro na comunicação com o servidor', 'error');
        }
    });
    
   // Função melhorada para mostrar alertas
   function showAlert(message, type = 'success') {
    // Remove alertas existentes primeiro
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

    // Verificação MFA
    mfaForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('mfaCode').value.trim();
        
        if (!/^\d{6}$/.test(code)) {
            showAlert('O código deve ter exatamente 6 dígitos', 'error');
            return;
        }
        
        try {
            const data = await makeRequest('verify_mfa', {
                mfa_token: mfaState.token,
                code: code
            });
            
            if (data.success) {
                window.location.href = data.redirect || 'index.html'; //em substituição ao dashboard
            } else {
                mfaState.remainingAttempts--;
                if (mfaState.remainingAttempts > 0) {
                    showAlert(`Código inválido. ${mfaState.remainingAttempts} tentativa(s) restante(s).`, 'error');
                } else {
                    showAlert('Número máximo de tentativas excedido. Por favor, faça login novamente.', 'error');
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
            }
        } catch (error) {
            showAlert(error.message || 'Falha na verificação do código', 'error');
        }
    });

    // Ativar MFA
    enableMfaBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        
        if (!email) {
            alert('Por favor, faça login primeiro');
            return;
        }

        try {
            const response = await fetch('/php/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    action: 'setup_mfa',
                    email: email
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Mostrar modal com QR code
                const modal = `
                    <div class="modal">
                        <h3>Configurar Autenticação em Dois Fatores</h3>
                        <p>Escaneie este QR code com seu aplicativo autenticador:</p>
                        <img src="${data.qr_code}" alt="QR Code">
                        <p>Ou insira manualmente: <strong>${data.secret}</strong></p>
                        <p>Depois insira o código gerado:</p>
                        <input type="text" id="setupCode" placeholder="Código de 6 dígitos">
                        <button id="confirmMfa">Confirmar</button>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', modal);
                document.getElementById('confirmMfa').addEventListener('click', confirmMfaSetup);
            } else {
                alert(data.message || 'Erro ao configurar MFA');
            }
        } catch (error) {
            alert('Erro na comunicação com o servidor');
        }
    });

    function confirmMfaSetup() {
        const code = document.getElementById('setupCode').value;
        
        if (!/^\d{6}$/.test(code)) {
            alert('Código deve ter 6 dígitos');
            return;
        }
        
        fetch('/php/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                action: 'confirm_mfa',
                code: code
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('MFA configurado com sucesso!');
                document.querySelector('.modal').remove();
                mfaStatus.innerHTML = 'Autenticação em Dois Fatores: <strong>Ativada</strong>';
                enableMfaBtn.textContent = 'MFA Ativado';
            } else {
                alert(data.message || 'Código inválido');
            }
        })
        .catch(error => {
            alert('Erro ao confirmar MFA');
        });
    }

    //Tratamento de erros
    async function makeRequest(action, data = {}) {
        
        const loader = document.createElement('div');
        loader.className = 'loader';
        document.body.appendChild(loader);
        
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    ...data,
                    action
                })
            })
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw new Error(error.message || 'Falha na comunicação com o servidor');
        }
    }

    
    /* Exemplo de uso no login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const data = await makeRequest('/php/login.php', {
                action: 'login',
                email: document.getElementById('email').value,
                senha: document.getElementById('senha').value
            });
    
            if (data.success) {
                // Processar sucesso
            } else {
                alert(data.message || 'Erro no login');
            }
        } catch (error) {
            alert('Erro na comunicação. Verifique o console para detalhes.');
            console.error('Detalhes do erro:', error);
        }
    }); */
});