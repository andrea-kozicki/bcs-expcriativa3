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

/* função para impedir atques de XSS e SQL Injection no campo email*/
function sanitizacaoEmail(email) {

    email = email.trim();
    email = email.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Impede XSS
    email = email.replace(/'/g, "&#39;").replace(/"/g, "&#34;"); //Impede SQL Injection
    email = sanitizeImput(email);
 

}

/* função para validar a senha com regex */

function validacaoSenha(senha) {
   
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{12,}$/; //Aplicação do regex para uma senha com 12 caracteres
    return regex.test(senha); //teste do regex

}

/* função para impedir atques de XSS e SQL Injection  no campo senha*/
function sanitizacaoSenha(senha) {

    senha = senha.trim();
    senha = senha.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Impede XSS
    senha = senha.replace(/'/g, "&#39;").replace(/"/g, "&#34;"); //Impede SQL Injection
    senha = sanitizeInput(senha);

}

function validacaoLogin(email, senha) {
    
    const email = document.getElementById('email').value
   
    //variavel a ser criada pela captura do valor da senha digitado no campo
    const senha = document.getElementById('senha').value;
    
    
    if (!validacaoEmail(email)) {
        alert('Por favor, insira um e-mail em padrão válido.');
        return;
    }

    if (!validacaoSenha(senha)) {
        
        alert('A senha deve conter pelo menos 12 caracteres.');
        return;
    }
}

document.getElementById('formlogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value
    };
    
    try {
        const response = await fetch('/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Protection': '1'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Exibir erro SEM usar innerHTML
            alert(data.erro || 'Erro no login');
            return;
        }
        
        // Redirecionar seguro
        window.location.href = '/index.html';
        
    } catch (error) {
        alert('Erro na comunicação com o servidor');
    }
});
/* fim validação do login */


    /*usando a biblioteca bcrypt */
if(validacaoSenha(senha)){    

    const senhaSantitizada = sanitizePassword(senha);
    const salt = bcrypt.genSaltSync(10); 
    const hashedPassword = bcrypt.hashSync(senhaSantitizada, salt);
    console.log("Hash da senha: ", hashedPassword);

    /*fetch('/login', {
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
    }*/
}

/* função para validação do login */


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

