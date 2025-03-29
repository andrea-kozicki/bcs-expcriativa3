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

/* função para impedir atques de XSS e SQL Injection */
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

/* função para impedir atques de XSS e SQL Injection */
function sanitizacaoSenha(senha) {

    senha = senha.trim();
    senha = senha.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Impede XSS
    senha = senha.replace(/'/g, "&#39;").replace(/"/g, "&#34;"); //Impede SQL Injection
    senha = sanitizeInput(senha);

}

    //variavel a ser criada pela captura do valor da senha digitado no campo
    senha = document.getElementById('senha').value;
   
    //usando hash para a senha
    const senhaHash = CryptoJS.SHA256(senha)

   
    //usando a biblioteca bcrypt
/*if(validacaoSenha(senha)){    

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
    } 
}*/


/* inicio procedimento para mandar link de redefinição de senha por email */

document.getElementById('redefinesenha').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const messageDiv = document.getElementById('message');
    
    try {
        const response = await fetch('/api/reset-password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.textContent = 'Link de redefinição enviado para seu email!';
            messageDiv.className = 'success';
        } else {
            messageDiv.textContent = data.message || 'Erro ao enviar email';
            messageDiv.className = 'error';
        }
    } catch (error) {
        messageDiv.classList.remove('hidden');
        messageDiv.textContent = 'Erro na conexão com o servidor';
        messageDiv.className = 'error';
    }
    
});

/* fim procedimento para mandar link de redefinição de senha por email */

/* inicio procedimento para fazer nova senha 

 // Extrai token da URL
 const urlParams = new URLSearchParams(window.location.search);
 const token = urlParams.get('token');
 document.getElementById('token').value = token;
 
 document.getElementById('novasenha').addEventListener('submit', async function(e) {
     e.preventDefault();
     
     const newPassword = document.getElementById('senha1').value;
     const confirmPassword = document.getElementById('senha2').value;
     const messageDiv = document.getElementById('message');
     
     if (newPassword !== confirmPassword) {
         messageDiv.textContent = 'As senhas não coincidem';
         messageDiv.className = 'error';
         messageDiv.classList.remove('hidden');
         return;
     }
     
     try {
         const response = await fetch('api/update_password.php', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
             },
             body: JSON.stringify({ 
                 token: document.getElementById('token').value,
                 new_password: newPassword 
             })
         });
         
         const data = await response.json();
         
         messageDiv.classList.remove('hidden');
         
         if (response.ok) {
             messageDiv.textContent = data.message || 'Senha atualizada com sucesso!';
             messageDiv.className = 'success';
         } else {
             messageDiv.textContent = data.message || 'Erro ao atualizar senha';
             messageDiv.className = 'error';
         }
     } catch (error) {
         messageDiv.classList.remove('hidden');
         messageDiv.textContent = 'Erro na conexão com o servidor';
         messageDiv.className = 'error';
     }
 });

/* fim procedimento para fazer nova senha */

