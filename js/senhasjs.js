document.addEventListener('DOMContentLoaded', () => {
    console.log("🟢 senhasjs.js carregado");

    // 🌐 SEÇÃO 0: Preenchimento automático de token/email
    const path = window.location.pathname;
    if (path.includes('novasenha.html')) {
        const params = new URLSearchParams(window.location.search);
        const email = params.get('email');
        const token = params.get('token');

        if (email) {
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.value = decodeURIComponent(email);
            }
        }

        if (token) {
            const tokenInput = document.getElementById('token');
            if (tokenInput) {
                tokenInput.value = token;
            }
        }
    }

    // 🔐 SEÇÃO 1: Formulário de redefinição de senha
    const form = document.getElementById('novasenha') || document.getElementById('form-alterar-senha');
    if (form) {
        const novaSenha = document.getElementById('novaSenha');
        const confirmarSenha = document.getElementById('confirmarSenha');
        const senhaHashInput = document.getElementById('senha_hash');
        const saltInput = document.getElementById('salt');
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

            const salt = gerarSalt();
            const senhaHash = CryptoJS.SHA256(novaSenha.value + salt).toString();
            senhaHashInput.value = senhaHash;
            saltInput.value = salt;

            try {
                const formData = new FormData(form);
                formData.delete('confirmarSenha');

                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                exibirMensagem(result.message, !result.success);

                if (result.success) {
                    setTimeout(() => {
                        alert("Senha alterada com sucesso!");
                        if (form.id === 'form-alterar-senha') {
                            window.location.reload();
                        } else {
                            window.location.href = "/perfil.html";
                        }
                    }, 500);
                }

            } catch (error) {
                exibirMensagem('Erro ao enviar o formulário. ' + error.message, true);
            }

            function exibirMensagem(texto, erro = false) {
                if (mensagem) {
                    mensagem.textContent = texto;
                    mensagem.classList.remove('hidden');
                    mensagem.style.color = erro ? 'red' : 'green';
                } else {
                    alert(texto);
                }
            }
        });
    }

    // 📩 SEÇÃO 2: Envio do link por e-mail
    const botaoToken = document.getElementById('btn-enviar-token');
    const mensagemToken = document.getElementById('mensagem-token');
    const emailInput = document.getElementById('email-redefinicao');

    if (botaoToken && mensagemToken && emailInput) {
        console.log("🟡 Preparando listener para botão de envio de link");
        botaoToken.addEventListener('click', async () => {
            console.log("✅ Botão de envio clicado");

            const email = emailInput.value.trim();
            mensagemToken.classList.remove('hidden');
            mensagemToken.style.color = 'red';

            if (!email) {
                mensagemToken.textContent = 'Digite um e-mail válido.';
                return;
            }

            try {
                const response = await fetch('/php/enviar_token.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ email })
                });

                const result = await response.json();
                mensagemToken.textContent = result.message;
                mensagemToken.style.color = result.success ? 'green' : 'red';

            } catch (err) {
                mensagemToken.textContent = 'Erro ao enviar o e-mail.';
            }
        });
    } else {
        console.warn("❌ Elementos do botão de envio não encontrados.");
    }

    // 🧩 Util
    function gerarSalt() {
        return CryptoJS.lib.WordArray.random(16).toString();
    }
});
