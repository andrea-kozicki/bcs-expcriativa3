document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      const resposta = await fetch("/php/logout.php", { method: "POST" });
      const dados = await resposta.json();

      if (dados.success) {
        localStorage.clear();
        alert("Logout realizado com sucesso.");
        window.location.href = "index.html";
      } else {
        alert("Erro ao fazer logout.");
      }
    } catch (erro) {
      console.error("Erro na requisição de logout:", erro);
      alert("Falha na comunicação com o servidor.");
    }
  });
});
