document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("formlogin");
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
  const mfaInput = document.getElementById("mfa_code");
  const mfaSection = document.getElementById("mfa-section");
  const qrOutput = document.getElementById("mfa-qr-code");
  const errorDiv = document.getElementById("error-message");
  const spinner = document.querySelector(".loading-spinner");

  // NAVBAR / DROPDOWNS
  const avatar = document.querySelector(".avatar");
  const userDropdown = document.querySelector(".dropdown-menu.setting");
  const genresBtn = document.querySelector(".dropdown-btn");
  const genresContainer = document.querySelector(".dropdown-container");
  const genresArrow = document.querySelector(".dropdown-arrow");
  const sidebar = document.querySelector(".sidebar");
  const barsIcon = document.querySelector(".fa-bars");

  // CARRINHO
  const cartIcon = document.querySelector(".cart");
  const cartMenu = document.querySelector(".cart-menu");

  // === Funções auxiliares ===

  async function getCSRFToken() {
    try {
      const res = await fetch("php/login_refeito.php?action=get_csrf");
      const json = await res.json();
      return json.csrf_token;
    } catch (err) {
      console.error("Erro ao obter token CSRF:", err);
      return "";
    }
  }

  function showMessage(msg, isSuccess = false) {
    if (errorDiv) {
      errorDiv.textContent = msg;
      errorDiv.style.color = isSuccess ? "green" : "red";
    }
  }

  function gerarQRCode(secret, email) {
  const otpauthUrl = `otpauth://totp/LoginApp:${email}?secret=${secret}&issuer=LoginApp`;

  const qrContainer = document.getElementById("mfa-qr-code");
  qrContainer.innerHTML = ""; // Limpa QR anterior
  qrContainer.style.display = "block";

  new QRCode(qrContainer, {
    text: otpauthUrl,
    width: 200,
    height: 200,
    colorDark: "#000",
    colorLight: "#fff",
    correctLevel: QRCode.CorrectLevel.H
  });

  console.log("✅ QR Code gerado:", otpauthUrl);
}


  // === SUBMISSÃO DO FORMULÁRIO ===

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const senha = senhaInput.value;
    const mfa_code = mfaInput.value.trim();
    const csrf_token = await getCSRFToken();

    if (!email || !senha) {
      showMessage("Preencha todos os campos.");
      return;
    }

    spinner?.classList.add("show");

    const payload = { email, senha, mfa_code, csrf_token };

    try {
      const res = await fetch("php/login_refeito.php?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      spinner?.classList.remove("show");

      if (json.mfa_required) {
        mfaSection.style.display = "block";

        if (json.new_mfa_secret) {
          gerarQRCode(json.new_mfa_secret, email);
          showMessage("Escaneie o QR Code com o app autenticador.");
        } else {
          showMessage("Insira o código do app autenticador.");
        }

        return;
      }

      if (json.success) {
        showMessage("Login realizado com sucesso!", true);
        setTimeout(() => {
          window.location.href = "perfil.html";
        }, 1500);
      } else {
        showMessage(json.message || "Erro ao fazer login.");
      }
    } catch (err) {
      spinner?.classList.remove("show");
      console.error("Erro ao enviar login:", err);
      showMessage("Erro na comunicação com o servidor.");
    }
  });

  // === INTERAÇÃO COM NAVBAR, DROPDOWNS e SIDEBAR ===

  if (avatar && userDropdown) {
    avatar.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("active");
      genresContainer?.classList.remove("active");
      genresArrow?.classList.remove("rotate");
    });
  }

  if (genresBtn && genresContainer && genresArrow) {
    genresBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      genresContainer.classList.toggle("active");
      genresArrow.classList.toggle("rotate");
      userDropdown?.classList.remove("active");
    });
  }

  if (barsIcon && sidebar) {
    barsIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("active");
    });
  }

  if (cartIcon && cartMenu) {
    cartIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      cartMenu.classList.toggle("active");
    });

    document.addEventListener("click", () => {
      cartMenu?.classList.remove("active");
      userDropdown?.classList.remove("active");
      genresContainer?.classList.remove("active");
      genresArrow?.classList.remove("rotate");
    });
  }
});
