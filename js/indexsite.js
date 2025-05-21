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

  // === Carrinho ===
  const carrinhoIcon = document.querySelector('.cart-icon');
  const carrinhoDropdown = document.getElementById('cartMenu');
  const contadorCarrinho = document.querySelector('.cart-count');
  const limparCarrinhoBtn = document.getElementById('limparCarrinho');
  const itensCarrinhoList = document.getElementById('cartItems');

  function atualizarContador() {
    const itens = JSON.parse(localStorage.getItem("cartItems")) || [];
    if (contadorCarrinho) contadorCarrinho.textContent = itens.length;
  }

  function renderizarItensCarrinho() {
    const itens = JSON.parse(localStorage.getItem("cartItems")) || [];
    if (!itensCarrinhoList) return;

    itensCarrinhoList.innerHTML = "";

    if (itens.length === 0) {
      const vazio = document.createElement("li");
      vazio.textContent = "Carrinho vazio";
      vazio.style.padding = "0.5rem";
      itensCarrinhoList.appendChild(vazio);
    } else {
      itens.forEach((item, index) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.padding = "0.5rem";

        const span = document.createElement("span");
        span.textContent = `${item.nome} - ${item.preco}`;

        const remover = document.createElement("button");
        remover.textContent = "X";
        remover.style.background = "transparent";
        remover.style.border = "none";
        remover.style.color = "red";
        remover.style.cursor = "pointer";
        remover.style.fontSize = "14px";
        remover.addEventListener("click", () => {
          itens.splice(index, 1);
          localStorage.setItem("cartItems", JSON.stringify(itens));
          atualizarContador();
          renderizarItensCarrinho();
        });

        li.appendChild(span);
        li.appendChild(remover);
        itensCarrinhoList.appendChild(li);
      });
    }
  }

  if (carrinhoIcon && carrinhoDropdown) {
    carrinhoIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      carrinhoDropdown.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!carrinhoDropdown.contains(e.target) && !carrinhoIcon.contains(e.target)) {
        carrinhoDropdown.classList.remove("show");
      }
    });
  }

  if (limparCarrinhoBtn) {
    limparCarrinhoBtn.addEventListener("click", () => {
      localStorage.removeItem("cartItems");
      atualizarContador();
      renderizarItensCarrinho();
    });
  }

  atualizarContador();
  renderizarItensCarrinho();
});
