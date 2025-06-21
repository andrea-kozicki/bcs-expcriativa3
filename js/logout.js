document.addEventListener("DOMContentLoaded", function () {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();

      fetch("/php/logout.php", {
        method: "POST",
        credentials: "include",
      })
        .then(() => {
          const id = localStorage.getItem("usuario_id");
          if (id) {
            localStorage.removeItem("usuario_id");
            localStorage.removeItem(`cartItems_${id}`);
          }
          alert("Logout realizado com sucesso.");
          window.location.href = "/login2.html";
        })
        .catch((error) => {
          console.error("Erro ao sair:", error);
        });
    });
  }
});
