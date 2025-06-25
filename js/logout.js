document.addEventListener("click", async (e) => {
  const btn = e.target.closest('.logoutBtn');
  if (btn) {
    e.preventDefault();
    try {
      const payload = await encryptHybrid(JSON.stringify({ acao: "logout" })); // pode ser {}
      const resposta = await fetch("/php/logout.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const encryptedResponse = await resposta.json();
      const decryptedJson = await decryptHybrid(encryptedResponse, payload._aesKey, payload._iv);
      const dados = JSON.parse(decryptedJson);

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
