document.addEventListener("DOMContentLoaded", () => {
  const formEndereco = document.getElementById("form-endereco");
  const msg = document.getElementById("mensagem-endereco");

  if (!formEndereco) return;

  formEndereco.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    msg.style.color = "red";

    const dados = {
      cep: document.getElementById("cep")?.value.trim(),
      rua: document.getElementById("rua")?.value.trim(),
      numero: document.getElementById("numero")?.value.trim(),
      cidade: document.getElementById("cidade")?.value.trim(),
      estado: document.getElementById("estado")?.value.trim()
    };

    if (!dados.cep || !dados.rua || !dados.numero || !dados.cidade || !dados.estado) {
      msg.textContent = "Preencha todos os campos.";
      return;
    }

    try {
      const payload = await encryptHybrid(JSON.stringify(dados));

      const response = await fetch("/php/atualizar_endereco.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      const result = await response.json();

      msg.style.color = result.success ? "green" : "red";
      msg.textContent = result.message;
    } catch (err) {
      console.error("Erro ao enviar endereço:", err);
      msg.textContent = "Erro ao salvar endereço.";
    }
  });
});
