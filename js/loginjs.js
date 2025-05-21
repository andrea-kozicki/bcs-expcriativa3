document.addEventListener("DOMContentLoaded", function () {
  // === ENVIO DO LOGIN VIA AJAX ===
  const loginForm = document.getElementById("formlogin");
  const errorMessage = document.getElementById("error-message");
  const spinner = document.querySelector(".loading-spinner");
  const mfaSection = document.getElementById("mfa-section");
  const qrCodeDiv = document.getElementById("mfa-qr-code");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      errorMessage.textContent = "";
      spinner.style.display = "block";

      const formData = new FormData(loginForm);
      formData.append("acao", "login"); // envia a ação obrigatória

      try {
        const response = await fetch("php/login_refeito.php", {
          method: "POST",
          body: formData,
          credentials: "include"
        });

        const result = await response.json();
        spinner.style.display = "none";

        if (result.success) {
          if (result.mfa_required) {
            // Mostrar campo MFA
            mfaSection.style.display = "block";
            if (result.qr_code_svg) {
              qrCodeDiv.style.display = "block";
              qrCodeDiv.innerHTML = result.qr_code_svg;
            }
          } else {
            // Login bem-sucedido sem MFA
            setTimeout(() => { 
              console.log("🔍 Sessão antes de redirecionar:");
              //debugger;
              fetch('php/session_status.php', { credentials: 'include' })
                .then(res => res.json())
                .then(data => {
                  console.log("🔍 Verificação final antes do redirecionamento:", data);
                  if (data.logged_in) {
                    window.location.replace("perfil.html");
                  } else {
                    console.warn("⚠️ Sessão ainda não ativa. Tentando novamente...");
                    setTimeout(() => location.reload(), 500); // Ou tentar novamente
                  }
                })
                .catch(err => {
                  console.error("❌ Erro ao verificar sessão antes do redirect:", err);
                });
            }, 500);
          }
        } else {
          errorMessage.textContent = result.message || "Erro ao autenticar.";
        }

      } catch (err) {
        spinner.style.display = "none";
        errorMessage.textContent = "Erro de rede ou resposta inválida do servidor.";
        console.error("Erro:", err);
      }
    });
  }

  // === DEMAIS FUNCIONALIDADES (sidebar, dropdowns, carrinho) ===

  const sidebar = document.querySelector('.sidebar');
  const barsIcon = document.querySelector('.fa-bars');
  const menuToggle = document.querySelector('#menu-toggle');

  function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('active');
  }

  barsIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSidebar();
  });

  menuToggle?.addEventListener('click', toggleSidebar);

  document.addEventListener("click", (e) => {
    const isClickInsideSidebar = sidebar?.contains(e.target);
    const isClickOnToggle = barsIcon?.contains(e.target) || menuToggle?.contains(e.target);
    if (!isClickInsideSidebar && !isClickOnToggle) {
      sidebar?.classList.remove("active");
    }
  });

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

  const carrinhoIcon = document.querySelector(".cart-icon");
  const carrinhoDropdown = document.getElementById("cartMenu");
  const contadorCarrinho = document.querySelector(".cart-count");
  const limparCarrinhoBtn = document.getElementById("limparCarrinho");
  const itensCarrinhoList = document.getElementById("cartItems");

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
