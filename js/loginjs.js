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
    //const senha = document.getElementById('senha').value;

    //usando a biblioteca bcrypt
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
    } */
}

/* função para validação do login */

function validacaoLogin(email, senha) {
    
    const email = document.getElementById('email').value
    const senha = document.getElementById('senha').value
    
    if (!validacaoEmail(email)) {
        alert('Por favor, insira um e-mail em padrão válido.');
        return;
    }

    if (!validateSenha(senha)) {
        
        alert('A senha deve conter pelo menos 12 caracteres.');
        return;
    }
}

/* fim validação do login */

 // Enviar o hash para o backend



