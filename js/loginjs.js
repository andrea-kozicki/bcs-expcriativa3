document.addEventListener("DOMContentLoaded", function () {
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

  const loginForm = document.getElementById("formlogin");
  const errorMessage = document.getElementById("error-message");
  const spinner = document.querySelector(".loading-spinner");
  const mfaSection = document.getElementById("mfa-section");
  const qrCodeDiv = document.getElementById("mfa-qr-code");
  const mfaInput = document.getElementById("mfa_code");
  const verificarBtn = document.getElementById("verificar-mfa");
  const mostrarQRBtn = document.getElementById("mostrar-qr-btn");
  const mostrarQRBox = document.getElementById("mostrar-qr-box");

  if (verificarBtn) verificarBtn.style.display = "none";

  let payloadUltimoLogin = null; // Salva para MFA

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email")?.value.trim();
      const senha = document.getElementById("senha")?.value.trim();

      if (!email || !senha) {
        alert("Preencha e-mail e senha.");
        return;
      }

      try {
        const payload = await encryptHybrid(JSON.stringify({
          email,
          senha,
          acao: "login"
        }));
        payloadUltimoLogin = payload; // Salva para MFA depois

        const resposta = await fetch("/php/login_refeito.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include"
        });

        const encryptedResponse = await resposta.json();
        const decryptedJson = await decryptHybrid(encryptedResponse, payload._aesKey, payload._iv);
        const resultado = JSON.parse(decryptedJson);

        if (resultado.mfa_required) {
          if (mfaSection) mfaSection.style.display = "block";
          if (verificarBtn) verificarBtn.style.display = "inline-block";

          const botaoLogin = loginForm.querySelector("button[type='submit']");
          if (botaoLogin) botaoLogin.disabled = true;

          if (qrCodeDiv && resultado.qr_svg) {
            qrCodeDiv.innerHTML = resultado.qr_svg;
            qrCodeDiv.style.display = "block";
            if (mostrarQRBox) mostrarQRBox.style.display = "none";

            // Marca QR como exibido, criptografado:
            const payloadQR = await encryptHybrid(JSON.stringify({}));
            const res = await fetch("/php/mfa_qr_visto.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payloadQR),
              credentials: "include"
            });
            const encryptedQR = await res.json();
            const decryptedQR = await decryptHybrid(encryptedQR, payloadQR._aesKey, payloadQR._iv);
            const json = JSON.parse(decryptedQR);
            if (json.success) {
              console.log("📌 QR marcado como exibido com sucesso.");
            } else {
              console.warn("⚠️ Falha ao marcar o QR como exibido.");
            }

          } else {
            qrCodeDiv.innerHTML = "<p>Use seu app autenticador para digitar o código.</p>";
            qrCodeDiv.style.display = "block";
            if (mostrarQRBox) mostrarQRBox.style.display = "block";
          }

          return;
        }

        if (resultado.success) {
          localStorage.setItem("usuario_id", resultado.usuario_id);
          localStorage.setItem("usuario_email", resultado.usuario_email || email);
          window.location.href = "/perfil.html";
        } else {
          alert(resultado.message || "Login falhou.");
        }

      } catch (err) {
        console.error("❌ Erro durante o login criptografado:", err);
        alert("Erro no login. Tente novamente.");
      }
    });
  }

  if (mostrarQRBtn) {
    mostrarQRBtn.addEventListener("click", async () => {
      try {
        // Criptografa até o reexibir QR!
        const payload = await encryptHybrid(JSON.stringify({}));
        const res = await fetch("/php/reexibir_qr.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
        const encryptedResponse = await res.json();
        const decryptedJson = await decryptHybrid(encryptedResponse, payload._aesKey, payload._iv);
        const data = JSON.parse(decryptedJson);

        if (data.success && data.qr_svg) {
          qrCodeDiv.innerHTML = data.qr_svg;
          qrCodeDiv.style.display = "block";
          if (mostrarQRBox) mostrarQRBox.style.display = "none";
        } else {
          alert(data.message || "Não foi possível exibir o QR.");
        }
      } catch (err) {
        alert("Erro ao tentar exibir o QR code novamente.");
      }
    });
  }

  async function enviarCodigoMFA() {
    const codigo = mfaInput?.value.trim();
    const email = document.getElementById("email")?.value;
    const senha = document.getElementById("senha")?.value;

    if (!codigo || !email || !senha) {
      alert("Preencha e-mail, senha e o código do MFA.");
      return;
    }

    if (verificarBtn) verificarBtn.disabled = true;

    try {
      const payload = await encryptHybrid(JSON.stringify({
        email,
        senha,
        mfa_code: codigo,
        acao: "verificar_mfa"
      }));

      const resposta = await fetch("/php/login_refeito.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      const encryptedResponse = await resposta.json();
      const decryptedJson = await decryptHybrid(encryptedResponse, payload._aesKey, payload._iv);
      const resultado = JSON.parse(decryptedJson);

      if (resultado.success) {
        localStorage.setItem("usuario_id", resultado.usuario_id);
        localStorage.setItem("usuario_email", resultado.usuario_email || email);
        window.location.replace(resultado.redirect || "/perfil.html");
      } else {
        alert(resultado.message || "Código MFA inválido.");
        if (verificarBtn) verificarBtn.disabled = false;
      }
    } catch (err) {
      console.error("❌ Erro na verificação do MFA:", err);
      alert("Erro ao verificar o código. Tente novamente.");
      if (verificarBtn) verificarBtn.disabled = false;
    }
  }

  if (verificarBtn) {
    verificarBtn.addEventListener("click", enviarCodigoMFA);
  }

  mfaInput?.addEventListener("keyup", async (e) => {
    if (e.key === "Enter") {
      await enviarCodigoMFA();
    }
  });

  // 🔄 Recuperação de senha (não é híbrido, só para referência)
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
        const payload = await encryptHybrid(JSON.stringify({
          email,
          acao: "redefinir"
        }));

        const response = await fetch('/php/enviar_token.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: "include"
        });

        // Se o endpoint estiver criptografado, troque por descriptografar
        const encryptedResponse = await response.json();
        const decryptedJson = await decryptHybrid(encryptedResponse, payload._aesKey, payload._iv);
        const result = JSON.parse(decryptedJson);

        mensagem.textContent = result.message;
        mensagem.style.color = result.success ? 'green' : 'red';

      } catch (err) {
        mensagem.textContent = 'Erro ao enviar solicitação. Tente novamente.';
      }
    });
  }
});
