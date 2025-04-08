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
    
    // Controle do carrossel
    carousel: {
        currentSlide: 0,
        interval: null,
        totalSlides: 0,
        slider: null,
        slides: null,
        manualBtns: null,
        autoBtns: null
    }
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
        
        // Elementos do carrossel
        slider: document.querySelector('.slider'),
        slides: document.querySelector('.slides'),
        manualBtns: document.querySelectorAll('.manual-btn'),
        autoBtns: document.querySelectorAll('.nav-auto div')
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
        toggleUserDropdown();
    }
    
    if (current !== 'genres' && appState.dropdowns.genresMenu) {
        toggleGenresDropdown();
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
    
    // Fecha dropdowns ao clicar fora
    document.addEventListener('click', () => {
        if (appState.dropdowns.userMenu) toggleUserDropdown();
        if (appState.dropdowns.genresMenu) toggleGenresDropdown();
    });
}

/* ============================================== */
/* 4. CONTROLE DO CARROSSEL */
/* ============================================== */

/**
 * Inicializa o carrossel com configurações padrão
 */
function initCarousel() {
    const elements = getDOMElements();
    if (!elements.slider) return;
    
    // Configura estado inicial
    appState.carousel = {
        currentSlide: 0,
        interval: null,
        totalSlides: document.querySelectorAll('.slide').length,
        slider: elements.slider,
        slides: elements.slides,
        manualBtns: elements.manualBtns,
        autoBtns: elements.autoBtns
    };
    
    // Configura navegação manual
    setupManualNavigation();
    
    // Configura navegação automática
    setupAutoNavigation();
    
    // Inicia autoplay
    startCarousel();
}

/**
 * Configura os botões de navegação manual
 */
function setupManualNavigation() {
    appState.carousel.manualBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => goToSlide(index));
    });
    
    // Ativa o primeiro botão
    if (appState.carousel.manualBtns.length > 0) {
        appState.carousel.manualBtns[0].classList.add('active');
    }
}

/**
 * Configura os botões de navegação automática
 */
function setupAutoNavigation() {
    appState.carousel.autoBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => goToSlide(index));
    });
    
    // Ativa o primeiro botão
    if (appState.carousel.autoBtns.length > 0) {
        appState.carousel.autoBtns[0].classList.add('active');
    }
}

/**
 * Inicia o autoplay do carrossel
 */
function startCarousel() {
    clearInterval(appState.carousel.interval);
    appState.carousel.interval = setInterval(() => {
        nextSlide();
    }, 4000);
}

/**
 * Avança para o próximo slide
 */
function nextSlide() {
    const nextIndex = (appState.carousel.currentSlide + 1) % appState.carousel.totalSlides;
    goToSlide(nextIndex);
}

/**
 * Navega para um slide específico
 * @param {number} index - Índice do slide desejado
 */
function goToSlide(index) {
    // Atualiza estado
    appState.carousel.currentSlide = index;
    
    // Move o carrossel
    appState.carousel.slides.style.transform = `translateX(-${index * 100}%)`;
    
    // Atualiza indicadores visuais
    updateNavigationButtons();
    
    // Reinicia o intervalo
    startCarousel();
}

/**
 * Atualiza os botões de navegação
 */
function updateNavigationButtons() {
    const { currentSlide, autoBtns, manualBtns } = appState.carousel;
    
    autoBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i === currentSlide);
    });
    
    manualBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i === currentSlide);
    });
}

/* ============================================== */
/* 5. INICIALIZAÇÃO DA APLICAÇÃO */
/* ============================================== */

/**
 * Inicializa todos os componentes da aplicação
 */
function initializeApp() {
    setupDropdownListeners();
    initCarousel();
}

// Inicia quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);