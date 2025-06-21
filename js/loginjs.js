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

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      errorMessage.textContent = "";
      spinner.style.display = "block";

      const email = document.getElementById("email")?.value;
      const senha = document.getElementById("senha")?.value;

      if (!email || !senha) {
        errorMessage.textContent = "Preencha e-mail e senha.";
        spinner.style.display = "none";
        return;
      }

      try {
        const payload = await encryptHybrid(JSON.stringify({ email, senha, acao: "login" }));

        const response = await fetch("/php/login_refeito.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
                    if (result.usuario_email) {
                      localStorage.setItem("usuario_email", result.usuario_email);
                    }
                    const redirectUrl = result.redirect || "/perfil.html";
                    window.location.replace(redirectUrl);
                  } else {
                    alert("Erro: sessão não iniciada no servidor.");
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
        const payload = await encryptHybrid(JSON.stringify({ email }));

        const response = await fetch('/php/enviar_token.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        mensagem.textContent = result.message;
        mensagem.style.color = result.success ? 'green' : 'red';

      } catch (err) {
        mensagem.textContent = 'Erro ao enviar solicitação. Tente novamente.';
      }
    });
  }

  const mfaInput = document.getElementById("mfa_code");
  const verificarBtn = document.getElementById("verificar-mfa");

  async function enviarCodigoMFA() {
    const codigo = mfaInput?.value.trim();
    const email = document.getElementById("email")?.value;
    const senha = document.getElementById("senha")?.value;

    if (!codigo || !email || !senha) {
      alert("Preencha e-mail, senha e o código do MFA.");
      return;
    }

    const dados = new FormData();
    dados.append("email", email);
    dados.append("senha", senha);
    dados.append("mfa_code", codigo);
    dados.append("acao", "verificar_mfa");

    try {
      const resposta = await fetch("/php/login_refeito.php", {
        method: "POST",
        body: dados,
        credentials: "include"
      });

      const resultado = await resposta.json();

      if (resultado.success) {
        localStorage.setItem("usuario_id", resultado.usuario_id);
        localStorage.setItem("usuario_email", resultado.usuario_email || email);
        window.location.replace(resultado.redirect || "/perfil.html");
      } else {
        alert(resultado.message || "Código MFA inválido.");
      }
    } catch (err) {
      console.error("❌ Erro na verificação do MFA:", err);
      alert("Erro ao verificar o código. Tente novamente.");
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
});
