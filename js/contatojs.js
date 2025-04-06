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


/* Validação e Sanitização do Formulário de Contato */
document.querySelector(".form-adm").addEventListener("submit", function (event) {
    event.preventDefault();

    const nome = document.getElementById("name").value.trim();
    const email = document.getElementById("E-mail").value.trim();
    const assunto = document.getElementById("assunto").value;
    const mensagem = document.getElementById("descricao").value.trim();

    let erros = [];

    if (nome.length < 3) {
        erros.push("O nome deve conter pelo menos 3 caracteres.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        erros.push("Informe um e-mail válido.");
    }

    if (assunto === "Selecione") {
        erros.push("Selecione um assunto válido.");
    }

    if (mensagem.length < 10) {
        erros.push("A mensagem deve conter no mínimo 10 caracteres.");
    }

    if (erros.length > 0) {
        showPopup(erros.join("<br>"), "error");
    } else {
        showPopup("Formulário Enviado! Aguarde um Retorno ", "success");
        this.reset(); // Limpa o formulário
    }
});

function showPopup(message, type) {
    const popup = document.getElementById("popup");
    const popupMessage = document.getElementById("popup-message");

    popup.className = `popup ${type} show`;
    popupMessage.innerHTML = message;

    setTimeout(() => {
        popup.classList.remove("show");
        popup.classList.add("hidden");
    }, 4000);
}


