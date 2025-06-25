document.addEventListener('DOMContentLoaded', () => {
  console.log("🟢 senhasjs.js carregado (versão atualizada)");

  const path = window.location.pathname;

  if (path.includes('novasenha.html')) {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const token = params.get('token');

    const emailInput = document.getElementById('email-redefinicao');
    const tokenInput = document.getElementById('token');

    if (email && emailInput) {
      emailInput.value = decodeURIComponent(email);
    }

    if (token && tokenInput) {
      tokenInput.value = token;
    }
  }

  const form = document.getElementById('novasenha') || document.getElementById('form-alterar-senha');
  if (form) {
    const novaSenha = document.getElementById('novaSenha');
    const confirmarSenha = document.getElementById('confirmarSenha');
    const mensagem = document.getElementById('mensagem') || document.getElementById('mensagem-senha');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (novaSenha.value.length < 12) {
        exibirMensagem('A nova senha deve conter no mínimo 12 caracteres.', true);
        return;
      }

      if (novaSenha.value !== confirmarSenha.value) {
        exibirMensagem('As senhas não coincidem.', true);
        return;
      }

      const dados = {
        novaSenha: novaSenha.value
      };

      const senhaAtualEl = document.getElementById('senhaAtual');
      const tokenEl = document.getElementById('token');
      const emailEl = document.getElementById('email-redefinicao');

      if (senhaAtualEl && senhaAtualEl.value.trim()) {
        dados.senhaAtual = senhaAtualEl.value.trim();
      }

      if (tokenEl && tokenEl.value.trim() && emailEl && emailEl.value.trim()) {
        dados.token = tokenEl.value.trim();
        dados.email = emailEl.value.trim();
      }

      try {
        const payload = await encryptHybrid(JSON.stringify(dados));

        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const encryptedResponse = await response.json();
        const decryptedJson = await decryptHybrid(encryptedResponse, payload._aesKey, payload._iv);
        const result = JSON.parse(decryptedJson);
        exibirMensagem(result.message, !result.success);

        if (result.success) {
          setTimeout(() => {
            alert("Senha alterada com sucesso!");
            window.location.href = path.includes("perfil") ? "/perfil.html" : "/login2.html";
          }, 500);
        }

      } catch (error) {
        exibirMensagem('Erro ao enviar o formulário. ' + error.message, true);
      }
    });

    function exibirMensagem(texto, erro = false) {
      if (mensagem) {
        mensagem.textContent = texto;
        mensagem.classList.remove('hidden');
        mensagem.style.color = erro ? 'red' : 'green';
      } else {
        alert(texto);
      }
    }
  }

  const botaoToken = document.getElementById('btn-enviar-token');
  const mensagemToken = document.getElementById('mensagem-token');
  const emailInput = document.getElementById('email-redefinicao');

  if (botaoToken && mensagemToken && emailInput) {
    botaoToken.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      mensagemToken.classList.remove('hidden');
      mensagemToken.style.color = 'red';

      if (!email) {
        mensagemToken.textContent = 'Digite um e-mail válido.';
        return;
      }

      try {
        const payload = await encryptHybrid(JSON.stringify({ email }));

        const response = await fetch('/php/enviar_token.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: "include"
        });

        const result = await response.json();
        mensagemToken.textContent = result.message;
        mensagemToken.style.color = result.success ? 'green' : 'red';

      } catch (err) {
        mensagemToken.textContent = 'Erro ao enviar o e-mail.';
      }
    });
  }
});
