document.addEventListener("DOMContentLoaded", () => {
  const pedidosDiv = document.getElementById("lista-pedidos");
  const enderecoDiv = document.getElementById("dados-endereco");

  // Função utilitária: fetch criptografado ida/volta
  async function fetchComCriptografia(url, dados = {}, metodo = "POST") {
    let options = {
      method: metodo,
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    };

    if (metodo === "POST") {
      const payload = await encryptHybrid(JSON.stringify(dados));
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(url, options);
    const encryptedPayload = await response.json();
    const decrypted = await decryptHybrid(encryptedPayload);
    return JSON.parse(decrypted);
  }

  // Carregar pedidos
  async function carregarPedidos() {
    try {
      const pedidos = await fetchComCriptografia("/php/listar_pedidos.php", {});
      if (!pedidos || pedidos.length === 0) {
        pedidosDiv.innerHTML = "<p>Você não tem pedidos registrados.</p>";
        return;
      }
      pedidosDiv.innerHTML = `
        <h3>📦 Seus Pedidos</h3>
        ${pedidos
          .map(
            (p) => `
              <div class="pedido">
                <b>Pedido ${p.codigo_pedido}</b><br>
                Data: ${p.data_pedido} | Total: R$ ${parseFloat(p.total).toFixed(2).replace('.', ',')}
                <br>
                <button class="btn-detalhes" data-codigo="${p.codigo_pedido}">Ver Detalhes</button>
                <div id="itens-${p.codigo_pedido}" class="hidden"></div>
              </div>
            `
          )
          .join("")}
      `;
      // Botões de detalhes com criptografia
      document.querySelectorAll(".btn-detalhes").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const codigo = btn.dataset.codigo;
          const div = document.getElementById("itens-" + codigo);
          if (!div) return;
          if (!div.classList.contains("hidden")) {
            div.classList.add("hidden");
            return;
          }
          try {
            const itens = await fetchComCriptografia("/php/listar_detalhes_pedido.php", { codigo_pedido: codigo });
            if (!itens || itens.length === 0) {
              div.innerHTML = "<p>Este pedido não possui itens.</p>";
            } else {
              div.innerHTML = `
                <ul>
                  ${itens
                    .map(
                      (i) =>
                        `<li>${i.titulo} - ${i.quantidade}x R$ ${parseFloat(i.preco_unitario).toFixed(2).replace(".", ",")}</li>`
                    )
                    .join("")}
                </ul>
              `;
            }
            div.classList.remove("hidden");
          } catch {
            div.innerHTML = "<p>Erro ao carregar os itens do pedido.</p>";
            div.classList.remove("hidden");
          }
        });
      });
    } catch (err) {
      pedidosDiv.innerHTML = "<p>Erro ao carregar seus pedidos.</p>";
    }
  }

  // Carregar endereço
  async function carregarEndereco() {
    try {
      const dados = await fetchComCriptografia("/php/processar_pedidos.php", {});
      if (!dados || Object.keys(dados).length === 0) {
        enderecoDiv.innerHTML = "<p>📍 Nenhum endereço cadastrado.</p>";
        return;
      }
      enderecoDiv.innerHTML = `
        <p><b>${dados.nome}</b></p>
        <p>${dados.rua}, ${dados.numero} - ${dados.cidade}/${dados.estado} | CEP: ${dados.cep}</p>
        <p>Tel: ${dados.telefone}</p>
      `;
    } catch (err) {
      enderecoDiv.innerHTML = "<p>Erro ao carregar endereço.</p>";
    }
  }

  carregarPedidos();
  carregarEndereco();
});
