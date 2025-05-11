// js/verificarSessao.js

async function verificarSessaoOuRedirecionar() {
    try {
        const resposta = await fetch('/bcs-expcriativa3/php/session_status.php');
        const dados = await resposta.json();

        if (!dados.logged_in) {
            window.location.href = '/bcs-expcriativa3/login2.html';
        }

        return dados;
    } catch (erro) {
        console.error('Erro ao verificar sessão:', erro);
        window.location.href = '/bcs-expcriativa3/login2.html';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const sessao = await verificarSessaoOuRedirecionar();

    const saudacao = document.querySelector('.top-list span');
    if (saudacao && sessao.email) {
        saudacao.textContent = `Olá, ${sessao.email}!`;
    }
});

