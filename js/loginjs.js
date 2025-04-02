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
            alert('Por favor, insira um e-mail válido.');
            return;
        }

        try {
            const response = await fetch('./login.php', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
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
                    mfaState.token = data.mfa_token;
                    loginForm.style.display = 'none';
                    mfaSection.style.display = 'block';
                } else {
                    window.location.href = 'dashboard.php';
                }
            } else {
                alert(data.message || 'Erro no login');
            }
        } catch (error) {
            alert('Erro na comunicação com o servidor');
        }
    });

    // Verificação MFA
    mfaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('mfaCode').value;
        
        if (!/^\d{6}$/.test(code)) {
            alert('Código deve ter 6 dígitos');
            return;
        }
        
        try {
            const response = await fetch('/login.php', {
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
                    alert(`Código inválido. ${mfaState.remainingAttempts} tentativas restantes.`);
                } else {
                    alert('Número máximo de tentativas excedido.');
                    mfaForm.style.display = 'none';
                }
            }
        } catch (error) {
            alert('Erro ao verificar código');
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
            const response = await fetch('login.php', {
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
        
        fetch('login.php', {
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
    async function makeRequest(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(data)
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }
    
    // Exemplo de uso no login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const data = await makeRequest('login.php', {
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
    });
});