document.addEventListener("DOMContentLoaded", function () {
  const carrinhoIcon = document.querySelector(".cart-icon");
  const carrinhoDropdown = document.getElementById("cartMenu");
  const contadorCarrinho = document.querySelector(".cart-count");
  const limparCarrinhoBtn = document.getElementById("limparCarrinho");
  const itensCarrinhoList = document.getElementById("cartItems");
  const voltarBtn = document.getElementById("voltarBtn");
  //const botaoAdicionar = document.getElementById("addCarrinho");

  function atualizarContadorCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const total = carrinho.reduce((acc, item) => acc + (item.quantidade || 1), 0);
    document.querySelectorAll(".cart-count").forEach(el => el.textContent = total);
  }

  function renderizarItensCarrinho() {
    const itens = JSON.parse(localStorage.getItem("carrinho")) || [];
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
        span.textContent = `${item.titulo} - ${item.preco} (x${item.quantidade})`;

        const remover = document.createElement("button");
        remover.textContent = "X";
        remover.style.background = "transparent";
        remover.style.border = "none";
        remover.style.color = "red";
        remover.style.cursor = "pointer";
        remover.style.fontSize = "14px";
        remover.addEventListener("click", () => {
          itens.splice(index, 1);
          localStorage.setItem("carrinho", JSON.stringify(itens));
          atualizarContadorCarrinho();
          renderizarItensCarrinho();
        });

        li.appendChild(span);
        li.appendChild(remover);
        itensCarrinhoList.appendChild(li);
      });
    }
  }

  /*if (botaoAdicionar) {
    botaoAdicionar.addEventListener("click", () => {
      const nome = document.querySelector(".titulo-produto")?.textContent || "Produto";
      const preco = document.querySelector(".preco-produto")?.textContent || "R$ 0,00";

      let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
      const existente = carrinho.find(item => item.titulo === nome);
      if (existente) {
        existente.quantidade += 1;
      } else {
        carrinho.push({ titulo: nome, preco: preco, quantidade: 1 });
      }

      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      atualizarContadorCarrinho();
      renderizarItensCarrinho();
      alert("Produto adicionado ao carrinho!");
    });
  }*/

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
      localStorage.removeItem("carrinho");
      atualizarContadorCarrinho();
      renderizarItensCarrinho();
    });
  }

  if (voltarBtn) {
    voltarBtn.addEventListener("click", () => {
      window.history.back();
    });
  }

  // === AVATAR DROPDOWN ===
  const avatar = document.querySelector('.avatar');
  const avatarDropdown = document.querySelector('.dropdown-menu.setting');

  if (avatar && avatarDropdown) {
    avatar.addEventListener('click', (e) => {
      e.stopPropagation();
      avatarDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!avatar.contains(e.target)) {
        avatarDropdown.classList.remove('active');
      }
    });
  }

  // === SIDEBAR ===
  const sidebar = document.querySelector('.sidebar');
  const barsIcon = document.querySelector('.fa-bars');
  const menuToggle = document.querySelector('#menu-toggle');

  function toggleSidebar() {
    sidebar?.classList.toggle('active');
  }

  barsIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSidebar();
  });

  menuToggle?.addEventListener('click', toggleSidebar);

  // === MENU DE GÊNEROS ===
  const genresBtn = document.querySelector('.dropdown-btn');
  const genresDropdown = document.querySelector('.dropdown-container');
  const genresArrow = document.querySelector('.dropdown-btn .dropdown-arrow');

  if (genresBtn && genresDropdown && genresArrow) {
    genresBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      genresDropdown.classList.toggle('active');
      genresArrow.classList.toggle('rotate');
      if (sidebar && !sidebar.classList.contains('active')) {
        sidebar.classList.add('active');
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sidebar') && !e.target.closest('.fa-bars')) {
      genresDropdown?.classList.remove('active');
      genresArrow?.classList.remove('rotate');
    }
  });

  atualizarContadorCarrinho();
  renderizarItensCarrinho();
});
