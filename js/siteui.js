document.addEventListener("DOMContentLoaded", function () {
  // Botão voltar
  const voltarBtn = document.getElementById("voltarBtn");
  voltarBtn?.addEventListener("click", () => window.history.back());

  // Avatar e menu dropdown
  const avatar = document.querySelector(".avatar");
  const avatarDropdown = document.querySelector(".dropdown-menu.setting, .dropdown-menu");

  if (avatar && avatarDropdown) {
    avatar.addEventListener("click", (e) => {
      e.stopPropagation();
      avatarDropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!avatar.contains(e.target)) {
        avatarDropdown.classList.remove("active");
      }
    });
  }

  // Sidebar e comportamento
  const sidebar = document.querySelector(".sidebar");
  const bars = document.querySelector(".bars");
  const menuToggle = document.getElementById("menu-toggle");
  const contentWrapper = document.querySelector(".wrapper");

  function abrirSidebar() {
    sidebar?.classList.add("active");
    contentWrapper?.classList.add("com-sidebar");
  }

  function fecharSidebar() {
    sidebar?.classList.remove("active");
    contentWrapper?.classList.remove("com-sidebar");
  }

  function toggleSidebar() {
    sidebar?.classList.contains("active") ? fecharSidebar() : abrirSidebar();
  }

  // TROCA PRINCIPAL: pointerdown ao invés de click!
  bars?.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    abrirSidebar();
  });

  // Deixe menuToggle opcionalmente para outros botões, mas só se precisar
  menuToggle?.addEventListener("pointerdown", abrirSidebar);

  // O listener global para fechar continua em click (não pointerdown!)
  document.addEventListener("click", (e) => {
    const dentroDoMenu = e.target.closest(".sidebar") ||
                         e.target.closest(".bars") ||
                         e.target.closest(".dropdown-btn") ||
                         e.target.closest(".dropdown-container");

    if (!dentroDoMenu) fecharSidebar();
  });

  // Dropdown de gêneros/categorias
  const genresBtn = document.querySelector(".dropdown-btn");
  const genresDropdown = document.querySelector(".dropdown-container");
  const genresArrow = document.querySelector(".dropdown-btn .dropdown-arrow");

  genresBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    genresDropdown?.classList.toggle("active");
    genresArrow?.classList.toggle("rotate");
    if (sidebar && !sidebar.classList.contains("active")) {
      abrirSidebar();
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".sidebar") && !e.target.closest(".bars")) {
      genresDropdown?.classList.remove("active");
      genresArrow?.classList.remove("rotate");
    }
  });

  // Dropdown de ações genéricas por ID
  window.actionDropdown = function (id) {
    closeDropdownAction();
    const el = document.getElementById("actionDropdown" + id);
    if (el) el.classList.toggle("show-dropdown-action");
  };

  function closeDropdownAction() {
    const dropdowns = document.querySelectorAll(".dropdown-action-item.show-dropdown-action");
    dropdowns.forEach(el => el.classList.remove("show-dropdown-action"));
  }

  window.addEventListener("click", (e) => {
    if (!e.target.matches(".dropdown-btn-action")) {
      closeDropdownAction();
    }
  });

  // Sidebar ativa por padrão (desktop)
  if (sidebar) {
    if (window.matchMedia("(max-width: 768px)").matches) {
      fecharSidebar();
    } else {
      abrirSidebar();
    }
  }

  // Comportamento do carrinho
  const cartIcon = document.querySelector(".cart-icon");
  const cartMenu = document.getElementById("cartMenu");

  if (cartIcon && cartMenu) {
    cartIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      cartMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".cart-icon") && !e.target.closest("#cartMenu")) {
        cartMenu.classList.add("hidden");
      }
    });
  }

  // === Carrossel ===
  const slides = document.querySelectorAll('.carousel-slide');
  const controlsContainer = document.querySelector('.carousel-controls');
  let currentSlide = 0;
  let carouselInterval;

  function showSlide(index) {
    slides.forEach(slide => {
      slide.classList.remove('active');
      slide.style.opacity = '0';
    });

    slides[index].classList.add('active');
    slides[index].style.opacity = '1';

    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    currentSlide = index;
  }

  function nextSlide() {
    let next = currentSlide + 1;
    if (next >= slides.length) next = 0;
    showSlide(next);
  }

  function startCarousel() {
    carouselInterval = setInterval(nextSlide, 7000);
  }

  function createDots() {
    if (!controlsContainer) return;
    controlsContainer.innerHTML = '';
    slides.forEach((_, index) => {
      const dot = document.createElement('span');
      dot.className = 'carousel-dot';
      dot.addEventListener('click', () => {
        clearInterval(carouselInterval);
        showSlide(index);
        startCarousel();
      });
      controlsContainer.appendChild(dot);
    });
  }

  if (slides.length > 0 && controlsContainer) {
    createDots();
    showSlide(0);
    startCarousel();
  }

});
