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
    document.body.classList.toggle('sidebar-active');
    
    // Fecha outros menus quando a sidebar é aberta
    if (elements.sidebar.classList.contains('active')) {
        closeOtherDropdowns('sidebar');
    }
}

/**
 * Configura os listeners para os dropdowns
 */
function setupDropdownListeners() {
    const elements = getDOMElements();
    
    document.addEventListener('click', (e) => {
        const elements = getDOMElements();
        const isSidebarClick = elements.sidebar.contains(e.target);
        const isBarsClick = elements.barsIcon.contains(e.target);
        
        if (!isSidebarClick && !isBarsClick && elements.sidebar.classList.contains('active')) {
            toggleSidebar();
        }
        
        // Fecha outros dropdowns
        if (appState.dropdowns.userMenu) toggleUserDropdown();
        if (appState.dropdowns.genresMenu) toggleGenresDropdown();
    });

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

    document.addEventListener('DOMContentLoaded', function() {
        const sidebar = document.querySelector('.sidebar');
        const barsIcon = document.querySelector('.fa-bars');
        
        barsIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-active');
        });
        
        // Fecha a sidebar ao clicar fora
        document.addEventListener('click', function(e) {
            if (!sidebar.contains(e.target) && !barsIcon.contains(e.target)) {
                sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-active');
            }
        });
    });
}

/* ============================================== */
/* 4. CONTROLE DO CARROSSEL */
/* ============================================== */

/**
 * Inicializa o carrossel com configurações padrão
 */
function initCarousel() {
    const container = document.querySelector('.carousel-container');
    const slides = document.querySelector('.carousel-slides');
    const slideItems = document.querySelectorAll('.carousel-slide');
    const controlsContainer = document.querySelector('.carousel-controls');
    
    // Cria controles visíveis
    slideItems.forEach((_, index) => {
        const control = document.createElement('button');
        control.classList.add('carousel-control');
        control.setAttribute('aria-label', `Ir para slide ${index + 1}`);
        controlsContainer.appendChild(control);
        slide.style.width = `${container.offsetWidth}px`;
    });

    // Redimensiona quando a janela muda de tamanho
    window.addEventListener('resize', () => {
        slideItems.forEach(slide => {
            slide.style.width = `${container.offsetWidth}px`;
        });
    });

    
     // Cria os controles abaixo do carrossel
     controlsContainer.innerHTML = ''; // Limpa controles existentes
     
     slideItems.forEach((_, index) => {
         const control = document.createElement('button');
         control.classList.add('carousel-control');
         if (index === 0) control.classList.add('active');
         control.addEventListener('click', () => goToSlide(index));
         controlsContainer.appendChild(control);
     });
    
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
    }, 6000);
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

/* ============================================== */
/* 6. AJUSTES DE RESPONSIVIDADE DINÂMICA */
/* ============================================== */

/**
 * Ajusta o carrossel para diferentes tamanhos de tela
 */
function initCarousel() {
    const container = document.querySelector('.carousel-container');
    const slides = document.querySelector('.carousel-slides');
    const slideItems = document.querySelectorAll('.carousel-slide');
    const controlsContainer = document.querySelector('.carousel-controls');
    
    if (!container || !slides || slideItems.length === 0) return;
    
    // Configuração inicial
    let currentIndex = 0;
    const totalSlides = slideItems.length;
    let intervalId = setInterval(nextSlide, 6000);
    
    // Cria os controles
    slideItems.forEach((_, index) => {
        const control = document.createElement('button');
        control.classList.add('carousel-control');
        if (index === 0) control.classList.add('active');
        control.addEventListener('click', () => goToSlide(index));
        controlsContainer.appendChild(control);
    });
    
    const controls = document.querySelectorAll('.carousel-control');
    
    // Função para ir para um slide específico
    function goToSlide(index) {
        currentIndex = index;
        slides.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateControls();
        resetInterval();
    }
    
    // Atualiza os controles visuais
    function updateControls() {
        controls.forEach((control, index) => {
            control.classList.toggle('active', index === currentIndex);
        });
    }
    
    // Avança para o próximo slide
    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalSlides;
        goToSlide(currentIndex);
    }
    
    // Reinicia o intervalo de autoplay
    function resetInterval() {
        clearInterval(intervalId);
        intervalId = setInterval(nextSlide, 4000);
    }
    
    // Inicia o carrossel
    function startCarousel() {
        resetInterval();
    }
    
    // Ajusta o tamanho do carrossel
    function adjustCarouselSize() {
        const isMobile = window.innerWidth <= 768;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isMobile) {
            container.style.aspectRatio = isLandscape ? '16/9' : '1/1';
            container.style.maxHeight = isLandscape ? '80vh' : '70vh';
        } else {
            container.style.aspectRatio = '16/9';
            container.style.maxHeight = '';
        }
    }
    
    // Event listeners
    window.addEventListener('resize', adjustCarouselSize);
    window.addEventListener('orientationchange', adjustCarouselSize);
    
    // Inicialização
    adjustCarouselSize();
    startCarousel();
}