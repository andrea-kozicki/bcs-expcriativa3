document.addEventListener("click", async (e) => {
  const btn = e.target.closest('.logoutBtn');
  if (btn) {
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
  }
});
