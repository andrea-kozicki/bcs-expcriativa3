function verificarSessaoOuRedirecionar() {
  const caminho = window.location.pathname;
  const paginaPrivada = caminho.includes("perfil") || caminho.includes("checkout");

  function atualizarMenuUsuario(data) {
    const menu = document.getElementById("menu-usuario");
    if (!menu) return;

    menu.innerHTML = "";

    if (data.logged_in) {
      localStorage.setItem("usuario_id", data.usuario_id);
      localStorage.setItem("usuario_email", data.email);

      menu.innerHTML = `
        <div class="item"><span class="fa-solid fa-user"></span><a href="perfil.html">${data.email}</a></div>
        <div class="item" id="menuSair"><span class="fa-solid fa-door-open"></span><a href="#" class="logoutBtn">Sair</a></div>
      `;
    } else {
      localStorage.clear();
      menu.innerHTML = `
        <div class="item"><span class="fa-solid fa-door-open"></span><a href="login2.html">Login</a></div>
      `;
    }
  }

  function verificarComServidor() {
    fetch("/php/session_status.php", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        atualizarMenuUsuario(data);

        if (!data.logged_in && paginaPrivada) {
          alert("Sua sessão expirou. Faça login novamente.");
          window.location.href = "login2.html";
        }
      })
      .catch(() => {
        console.error("Erro ao verificar a sessão com o servidor.");
      });
  }

  verificarComServidor();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", verificarSessaoOuRedirecionar);
} else {
  verificarSessaoOuRedirecionar();
}
