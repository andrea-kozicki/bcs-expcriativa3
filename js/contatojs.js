/**
 * SISTEMA PRINCIPAL - LIVRARIA
 * 
 * Organizado por funcionalidades principais
 * Comentários detalhados para cada seção
 */

/* ============================================== */
/* 1. ESTADO GLOBAL DA APLICAÇÃO */
/* ============================================== */
const appState = {
    // Controle dos menus dropdown
    dropdowns: {
        userMenu: false,
        genresMenu: false
    },
    
};

/* ============================================== */
/* 2. GERENCIAMENTO DE ELEMENTOS DO DOM */
/* ============================================== */

/**
 * Obtém todos os elementos DOM necessários
 * @returns {Object} Objeto com referências aos elementos
 */
function getDOMElements() {
    return {
        // Elementos da navbar
        avatar: document.querySelector('.avatar'),
        userDropdown: document.querySelector('.dropdown-menu.setting'),
        
        // Elementos da sidebar
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

/**
 * Alterna o menu dropdown do usuário
 */
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

/**
 * Alterna o menu dropdown de gêneros
 */
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

/**
 * Fecha outros dropdowns abertos
 * @param {string} current - Dropdown atual que deve permanecer aberto
 */
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

/**
 * Alterna a sidebar entre estados expandido/recolhido
 */
function toggleSidebar() {
    const elements = getDOMElements();
    elements.sidebar.classList.toggle('active');
}

/**
 * Configura os listeners para os dropdowns
 */
function setupDropdownListeners() {
    const elements = getDOMElements();
    
    // Avatar do usuário
    if (elements.avatar) {
        elements.avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserDropdown();
        });
    }
    
    // Menu de gêneros
    if (elements.genresBtn) {
        elements.genresBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleGenresDropdown();
        });
    }
    
    // Botão para alternar sidebar
    if (elements.barsIcon) {
        elements.barsIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }
    
    // Previne o fechamento ao clicar dentro do dropdown
    if (elements.genresDropdown) {
        elements.genresDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Fecha dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
        // Verifica se o clique foi fora dos elementos do dropdown
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
    
    // Fecha o dropdown de gêneros ao clicar em um item
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
/* 4. INICIALIZAÇÃO DA APLICAÇÃO */
/* ============================================== */

/**
 * Inicializa todos os componentes da aplicação
 */
function initializeApp() {
    setupDropdownListeners();
    
}

// Inicia quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);


/* ============================================== */
/* 5. Validação e Sanitização do Formulário de Contato 
/* ============================================== */


document.querySelector(".form-adm").addEventListener("submit", function (event) {
    event.preventDefault();

    const nome = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
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
        fetch("php/enviar_contato.php", {
            method: "POST",
            body: new FormData(document.querySelector(".form-adm"))
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showPopup(data.message, "success");
                document.querySelector(".form-adm").reset();
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


/* ============================================== */
/* 6. POPUP
/* ============================================== */
function showPopup(message, type = "success") {
    // Remove qualquer popup existente
    const existing = document.querySelector(".popup-message");
    if (existing) existing.remove();

    // Cria o container do popup
    const popup = document.createElement("div");
    popup.className = `popup-message ${type}`;
    popup.innerHTML = `
        <strong>${type === "success" ? "✅ Sucesso:" : "❌ Erro:"}</strong>
        <p>${message}</p>
    `;

    // Estilo básico (se não for usar no CSS)
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

    // Remover após 5 segundos
    setTimeout(() => {
        popup.style.opacity = "0";
        setTimeout(() => popup.remove(), 500);
    }, 5000);
}

