
document.addEventListener('DOMContentLoaded', function () {

    // === Seção 1: Seletores de elementos ===
    const form = document.getElementById('novasenha');
    const novaSenha = document.getElementById('novaSenha');
    const confirmarSenha = document.getElementById('confirmarSenha');
    const senhaHashInput = document.getElementById('senha_hash');
    const saltInput = document.getElementById('salt');
    const mensagem = document.getElementById('mensagem');

    // === Seção 2: Evento de envio do formulário ===
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validação de senha
        if (novaSenha.value.length < 12) {
            exibirMensagem('A senha deve conter no mínimo 12 caracteres.', true);
            return;
        }

        if (novaSenha.value !== confirmarSenha.value) {
            exibirMensagem('As senhas não coincidem.', true);
            return;
        }

        // Gera salt e hash da senha
        const salt = gerarSalt();
        const senhaHash = CryptoJS.SHA256(novaSenha.value + salt).toString();
        senhaHashInput.value = senhaHash;
        saltInput.value = salt;

        // Envia dados via fetch
        try {
            const formData = new FormData(form);
            formData.delete('confirmarSenha'); // 🔐 Remove antes do envio
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}`);
            }

            const result = await response.json();
            exibirMensagem(result.message, !result.success);

            // Sucesso: alerta popup e redireciona
            if (result.success) {
                setTimeout(() => {
                    alert("Senha alterada com sucesso!");
                    window.location.href = "/perfil.html";
                }, 500); // espera um pouco para exibir o alert
            }

        } catch (error) {
            exibirMensagem('Erro ao enviar o formulário. ' + error.message, true);
        }
    });

    // === Seção 3: Funções auxiliares ===

    // Geração de salt aleatório
    function gerarSalt() {
        return CryptoJS.lib.WordArray.random(16).toString();
    }

    // Exibe mensagem no elemento de feedback
    function exibirMensagem(texto, erro = false) {
        mensagem.textContent = texto;
        mensagem.classList.remove('hidden');
        mensagem.style.color = erro ? 'red' : 'green';
    }

});
