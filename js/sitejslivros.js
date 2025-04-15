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
/* 5. AÇÕES DOS BOTÕES */
/* ============================================== */


//Botão voltar quando se está ná página do produto

document.getElementById('voltarBtn').addEventListener('click', function() {
    window.history.back();
  });



