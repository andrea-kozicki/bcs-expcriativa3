document.addEventListener('DOMContentLoaded', () => {
  // === Sidebar e Dropdowns ===
  const sidebar = document.querySelector('.sidebar');
  const barsIcon = document.querySelector('.fa-bars');
  const menuToggle = document.querySelector('#menu-toggle');
  const userDropdown = document.querySelector('.dropdown-menu.setting');
  const avatar = document.querySelector('.avatar');
  const genresBtn = document.querySelector('.dropdown-btn');
  const genresDropdown = document.querySelector('.dropdown-container');
  const genresArrow = document.querySelector('.dropdown-btn .dropdown-arrow');

  function toggleSidebar() {
    sidebar?.classList.toggle('active');
  }

  barsIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSidebar();
  });

  menuToggle?.addEventListener('click', toggleSidebar);

  avatar?.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown?.classList.toggle('active');
  });

  genresBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    genresDropdown?.classList.toggle('active');
    genresArrow?.classList.toggle('rotate');
    if (sidebar && !sidebar.classList.contains('active')) {
      sidebar.classList.add('active');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sidebar') && !e.target.closest('.fa-bars')) {
      userDropdown?.classList.remove('active');
      genresDropdown?.classList.remove('active');
      genresArrow?.classList.remove('rotate');
    }
  });

  // === Marca item ativo no menu ===
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('a.sidebar-nav[href]').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');

      const parentDropdown = link.closest('.dropdown-container');
      if (parentDropdown) {
        parentDropdown.classList.add('active');
        genresArrow?.classList.add('rotate');
      }
    }
  });

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
