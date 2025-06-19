async function verificarSessaoOuRedirecionar() {
    try {
        const resposta = await fetch('/php/session_status.php', {
            method: 'GET',
            credentials: 'include'  // 🔴 ESSENCIAL para enviar os cookies
        });

        const dados = await resposta.json();

        if (!dados.logged_in) {
            window.location.href = '/login2.html';
        }

        return dados;
    } catch (erro) {
        console.error('Erro ao verificar sessão:', erro);
        window.location.href = '/login2.html';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const sessao = await verificarSessaoOuRedirecionar();

    const emailInput = document.getElementById('email');
    if (emailInput && sessao.email) {
        emailInput.value = sessao.email;
    }

    const saudacao = document.querySelector('.top-list span');
    if (saudacao && sessao.email) {
        saudacao.textContent = `Olá, ${sessao.email}!`;
    }
});

