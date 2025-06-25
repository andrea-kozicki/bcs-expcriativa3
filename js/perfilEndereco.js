document.addEventListener("DOMContentLoaded", () => {
  const formEndereco = document.getElementById("form-endereco");
  const msg = document.getElementById("mensagem-endereco");
  if (!formEndereco) return;

  // Troca a URL conforme a ação do form. Exemplo com data-acao.
  const urlEndpoint = formEndereco.dataset.acao === "salvar"
    ? "/php/salvar_endereco.php"
    : "/php/atualizar_endereco.php";

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
      const response = await fetch(urlEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });
      const encryptedResult = await response.json();
      const decrypted = await decryptHybrid(encryptedResult);
      const result = JSON.parse(decrypted);

      msg.style.color = result.success ? "green" : "red";
      msg.textContent = result.message || (result.success ? "Endereço salvo!" : "Falha ao salvar endereço.");
    } catch (err) {
      console.error("Erro ao enviar endereço:", err);
      msg.textContent = "Erro ao salvar endereço.";
    }
  });

  // Busca o endereço atual e preenche (opcional)
  async function carregarEndereco() {
    try {
      const response = await fetch("/php/endereco_usuario.php", {
        method: "GET",
        credentials: "include"
      });
      const encryptedResult = await response.json();
      const decrypted = await decryptHybrid(encryptedResult);
      const dados = JSON.parse(decrypted);

      // Preenche campos se achar endereço
      if (dados && Object.keys(dados).length > 0) {
        document.getElementById("cep").value = dados.cep || "";
        document.getElementById("rua").value = dados.rua || "";
        document.getElementById("numero").value = dados.numero || "";
        document.getElementById("cidade").value = dados.cidade || "";
        document.getElementById("estado").value = dados.estado || "";
      }
    } catch (err) {
      console.error("Erro ao carregar endereço:", err);
    }
  }

  carregarEndereco();
});
