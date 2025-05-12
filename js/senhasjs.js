document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('novasenha');
    const senha1 = document.getElementById('senha1');
    const senha2 = document.getElementById('senha2');
    const senhaHashInput = document.getElementById('senha_hash');
    const saltInput = document.getElementById('salt');
    const mensagem = document.getElementById('mensagem');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (senha1.value.length < 12) {
            exibirMensagem('A senha deve conter no mínimo 12 caracteres.', true);
            return;
        }

        if (senha1.value !== senha2.value) {
            exibirMensagem('As senhas não coincidem.', true);
            return;
        }

        const salt = gerarSalt();
        const senhaHash = CryptoJS.SHA256(senha1.value + salt).toString();

        senhaHashInput.value = senhaHash;
        saltInput.value = salt;

        const formData = new FormData(form);
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        exibirMensagem(result.message, !result.success);
    });

    function gerarSalt() {
        return CryptoJS.lib.WordArray.random(16).toString();
    }

    function exibirMensagem(texto, erro = false) {
        mensagem.textContent = texto;
        mensagem.classList.remove('hidden');
        mensagem.style.color = erro ? 'red' : 'green';
    }
});
