document.addEventListener("DOMContentLoaded", function () {

  // ============================
  // ✅ BLOCO 1: MENSAGEM DE ATIVAÇÃO
  // ============================
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("ativado") === "1") {
    const div = document.createElement("div");
    div.innerText = "Conta ativada com sucesso! Faça seu login.";
    div.style.background = "#d4edda";
    div.style.color = "#155724";
    div.style.padding = "10px";
    div.style.marginBottom = "15px";
    div.style.border = "1px solid #c3e6cb";
    div.style.borderRadius = "5px";
    div.style.textAlign = "center";
    div.style.fontWeight = "bold";

    const form = document.querySelector("form");
    if (form) {
      form.parentNode.insertBefore(div, form);
    } else {
      document.body.prepend(div);
    }
  }

  // ============================
  // 🔐 BLOCO 2: LOGIN COM MFA
  // ============================
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
      formData.append("acao", "login");

      try {
        const response = await fetch("/php/login_refeito.php", {
          method: "POST",
          body: formData,
          credentials: "include"
        });

        const result = await response.json();
        spinner.style.display = "none";

        if (result.success) {
          if (result.mfa_required) {
            mfaSection.style.display = "block";
            if (result.qr_svg) {
              qrCodeDiv.style.display = "block";
              qrCodeDiv.innerHTML = result.qr_svg;
            }
          } else {
            setTimeout(() => {
              fetch('/php/session_status.php', { credentials: 'include' })
                .then(res => res.json())
                .then(data => {
                  if (data.logged_in) {
                    if (result.usuario_id) {
                      localStorage.setItem("usuario_id", result.usuario_id);
                    }
                    const redirectUrl = result.redirect || "/perfil.html";
                    window.location.replace(redirectUrl);
                  } else {
                    setTimeout(() => location.reload(), 500);
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

  // ============================
  // 🧭 BLOCO 3: INTERFACE (sidebar, dropdowns)
  // ============================
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

});

// ============================
// 🔑 BLOCO 4: Envio de link de redefinição de senha
// ============================
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-enviar-link');
  const emailInput = document.getElementById('email-redefinicao');
  const mensagem = document.getElementById('mensagem-redefinicao');

  if (btn && emailInput && mensagem) {
    btn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      mensagem.classList.remove('hidden');
      mensagem.style.color = 'red';

      if (!email) {
        mensagem.textContent = 'Digite um e-mail válido.';
        return;
      }

      try {
        const response = await fetch('/php/enviar_token.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ email })
        });

        const result = await response.json();
        mensagem.textContent = result.message;
        mensagem.style.color = result.success ? 'green' : 'red';

      } catch (err) {
        mensagem.textContent = 'Erro ao enviar solicitação. Tente novamente.';
      }
    });
  }
});
