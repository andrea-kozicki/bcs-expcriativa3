/**
 * SISTEMA PRINCIPAL - LIVRARIA
 */

/* ============================================== */
/* 1. ESTADO GLOBAL DA APLICAÇÃO */
/* ============================================== */
const appState = {
    dropdowns: {
        userMenu: false,
        genresMenu: false
    },
};

/* ============================================== */
/* 2. GERENCIAMENTO DE ELEMENTOS DO DOM */
/* ============================================== */
function getDOMElements() {
    return {
        avatar: document.querySelector('.avatar'),
        userDropdown: document.querySelector('.dropdown-menu.setting'),
        genresBtn: document.querySelector('.dropdown-btn'),
        genresDropdown: document.querySelector('.dropdown-container'),
        dropdownArrow: document.querySelector('.dropdown-btn .fa-caret-down'),
        sidebar: document.querySelector('.sidebar'),
        barsIcon: document.querySelector('.fa-bars'),
    };
}

/* ============================================== */
/* 3. CONTROLE DOS MENUS DROPDOWN */
/* ============================================== */
function toggleUserDropdown() {
    const elements = getDOMElements();
    appState.dropdowns.userMenu = !appState.dropdowns.userMenu;

    if (appState.dropdowns.userMenu) {
        elements.userDropdown.classList.add('active');
        closeOtherDropdowns('user');
    } else {
        elements.userDropdown.classList.remove('active');
    }
}

function toggleGenresDropdown() {
    const elements = getDOMElements();
    appState.dropdowns.genresMenu = !appState.dropdowns.genresMenu;

    if (appState.dropdowns.genresMenu) {
        elements.genresDropdown.classList.add('active');
        elements.dropdownArrow.classList.add('rotate');
        closeOtherDropdowns('genres');
    } else {
        elements.genresDropdown.classList.remove('active');
        elements.dropdownArrow.classList.remove('rotate');
    }
}

function closeOtherDropdowns(current) {
    const elements = getDOMElements();

    if (current !== 'user' && appState.dropdowns.userMenu) {
        appState.dropdowns.userMenu = false;
        elements.userDropdown.classList.remove('active');
    }

    if (current !== 'genres' && appState.dropdowns.genresMenu) {
        appState.dropdowns.genresMenu = false;
        elements.genresDropdown.classList.remove('active');
        elements.dropdownArrow.classList.remove('rotate');
    }
}

function toggleSidebar() {
    const elements = getDOMElements();
    elements.sidebar.classList.toggle('active');
}

function setupDropdownListeners() {
    const elements = getDOMElements();

    if (elements.avatar) {
        elements.avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserDropdown();
        });
    }

    if (elements.genresBtn) {
        elements.genresBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleGenresDropdown();
        });
    }

    if (elements.barsIcon) {
        elements.barsIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (elements.genresDropdown) {
        elements.genresDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-btn')) {
            if (appState.dropdowns.userMenu) {
                appState.dropdowns.userMenu = false;
                elements.userDropdown.classList.remove('active');
            }
            if (appState.dropdowns.genresMenu) {
                appState.dropdowns.genresMenu = false;
                elements.genresDropdown.classList.remove('active');
                elements.dropdownArrow.classList.remove('rotate');
            }
        }
    });

    const genreLinks = document.querySelectorAll('.dropdown-container .sidebar-nav');
    genreLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (appState.dropdowns.genresMenu) {
                toggleGenresDropdown();
            }
        });
    });
}

/* ============================================== */
/* 4. INICIALIZAÇÃO */
/* ============================================== */
function initializeApp() {
    setupDropdownListeners();
}
document.addEventListener('DOMContentLoaded', initializeApp);

/* ============================================== */
/* 5. FORMULÁRIO DE CONTATO */
/* ============================================== */
const formContato = document.querySelector(".form-adm");
if (formContato) {
    formContato.addEventListener("submit", function (event) {
        event.preventDefault();

        const nomeEl = document.getElementById("nome");
        const emailEl = document.getElementById("email");
        const assuntoEl = document.getElementById("assunto");
        const mensagemEl = document.getElementById("mensagem");

        const nome = nomeEl ? nomeEl.value.trim() : "";
        const email = emailEl ? emailEl.value.trim() : "";
        const assunto = assuntoEl ? assuntoEl.value : "";
        const mensagem = mensagemEl ? mensagemEl.value.trim() : "";

        console.log("DEBUG - Nome:", nome);
        console.log("DEBUG - Email:", email);
        console.log("DEBUG - Assunto:", assunto);
        console.log("DEBUG - Mensagem:", mensagem);

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
            fetch("php/enviar_contato.php", {
                method: "POST",
                body: new FormData(formContato)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showPopup(data.message, "success");
                    formContato.reset();
                } else {
                    showPopup(data.message, "error");
                }
            })
            .catch(error => {
                console.error("Erro ao enviar:", error);
                showPopup("Erro ao enviar a mensagem. Tente novamente.", "error");
            });
        }
    });
}

/* ============================================== */
/* 6. POPUP */
/* ============================================== */
function showPopup(message, type = "success") {
    const existing = document.querySelector(".popup-message");
    if (existing) existing.remove();

    const popup = document.createElement("div");
    popup.className = `popup-message ${type}`;
    popup.innerHTML = `
        <strong>${type === "success" ? "✅ Sucesso:" : "❌ Erro:"}</strong>
        <p>${message}</p>
    `;

    Object.assign(popup.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: type === "success" ? "#d4edda" : "#f8d7da",
        color: type === "success" ? "#155724" : "#721c24",
        border: "1px solid",
        borderColor: type === "success" ? "#c3e6cb" : "#f5c6cb",
        padding: "12px 20px",
        borderRadius: "5px",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        zIndex: 9999,
        fontFamily: "Arial, sans-serif",
        transition: "opacity 0.5s ease",
    });

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.style.opacity = "0";
        setTimeout(() => popup.remove(), 500);
    }, 5000);
}
