async function verificarSessaoOuRedirecionar() {
  try {
    const resposta = await fetch("/php/session_status.php", {
      method: "GET",
      credentials: "include"
    });

    const dados = await resposta.json();

    if (!dados.logged_in) {
      localStorage.removeItem("usuario_id");
      localStorage.removeItem("usuario_email");
      const paginasProtegidas = ["checkout", "perfil", "pedido-concluido"];
      const atual = window.location.pathname;
      if (paginasProtegidas.some(p => atual.includes(p))) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "/login2.html";
        return;
      }
    }

    return dados;
  } catch (erro) {
    console.error("Erro ao verificar sessão:", erro);
    window.location.href = "/login2.html";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const sessao = await verificarSessaoOuRedirecionar();
  if (!sessao) return;

  // Preenche campos de e-mail ou saudação
  const emailInput = document.getElementById("email");
  if (emailInput && sessao.email) {
    emailInput.value = sessao.email;
  }

  const saudacao = document.querySelector(".top-list span");
  if (saudacao && sessao.email) {
    saudacao.textContent = `Olá, ${sessao.email}!`;
  }

  // Armazena usuario_id e email localmente
  if (sessao.usuario_id) {
    localStorage.setItem("usuario_id", sessao.usuario_id);
  }
  if (sessao.email) {
    localStorage.setItem("usuario_email", sessao.email);
  }

  // Menu adaptativo
  const menuLogin = document.getElementById("menuLogin");
  const menuPerfil = document.getElementById("menuPerfil");
  const menuSair = document.getElementById("menuSair");

  if (sessao.logged_in) {
    menuLogin?.classList.add("hidden");
    menuPerfil?.classList.remove("hidden");
    menuSair?.classList.remove("hidden");
  } else {
    menuLogin?.classList.remove("hidden");
    menuPerfil?.classList.add("hidden");
    menuSair?.classList.add("hidden");
  }
});
