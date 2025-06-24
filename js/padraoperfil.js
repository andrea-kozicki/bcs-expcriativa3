document.addEventListener("DOMContentLoaded", () => {
  const usuario_id = localStorage.getItem("usuario_id");
  const usuario_email = localStorage.getItem("usuario_email");

  if (!usuario_id || !usuario_email) {
    console.warn("Usuário não logado.");
    return;
  }

  const spanEmail = document.getElementById("emailUsuario");
  if (spanEmail) spanEmail.textContent = usuario_email;

  // =========================
  // PEDIDOS DO USUÁRIO
  // =========================
  fetch("../php/listar_pedidos.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ usuario_id }),
     credentials: "include"
  })
    .then((res) => res.json())
    .then((pedidos) => {
      const lista = document.getElementById("lista-pedidos");
      if (!lista) return;
      if (!pedidos || pedidos.length === 0) {
        lista.innerHTML = "<p>⚠️ Nenhum pedido encontrado.</p>";
        return;
      }

      pedidos.forEach((pedido) => {
        const card = document.createElement("div");
        card.classList.add("pedido-card");

        const total = parseFloat(pedido.total || 0).toFixed(2).replace(".", ",");

        card.innerHTML = `
          <p><strong>Pedido ${pedido.codigo_pedido}</strong></p>
          <p>Data: ${pedido.data_pedido || "Data não informada"} | Total: R$ ${total}</p>
          <button class="btn-detalhes" data-codigo="${pedido.codigo_pedido}">Ver Detalhes</button>
          <div class="itens-pedido hidden" id="itens-${pedido.codigo_pedido}"></div>
        `;

        lista.appendChild(card);
      });

      document.querySelectorAll(".btn-detalhes").forEach((btn) => {
        btn.addEventListener("click", () => {
          const codigo = btn.dataset.codigo;
          const div = document.getElementById("itens-" + codigo);
          if (!div) return;
          if (!div.classList.contains("hidden")) {
            div.classList.add("hidden");
            return;
          }

          fetch("../php/listar_detalhes_pedido.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ codigo_pedido: codigo }),
            credentials: "include"
          })
            .then((res) => res.json())
            .then((itens) => {
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
            })
            .catch(() => {
              div.innerHTML = "<p>Erro ao carregar os itens do pedido.</p>";
              div.classList.remove("hidden");
            });
        });
      });
    })
    .catch(() => {
      const lista = document.getElementById("lista-pedidos");
      if (lista) {
        lista.innerHTML = "<p>Erro ao carregar pedidos.</p>";
      }
    });

  // =========================
  // ENDEREÇO DO USUÁRIO
  // =========================
  fetch("../php/processar_pedidos.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ usuario_id }),
     credentials: "include"
  })
    .then((res) => res.json())
    .then((dados) => {
      const div = document.getElementById("dados-endereco");
      if (!div) return;
      if (!dados || !dados.cep) {
        div.innerHTML = "<p>⚠️ Nenhum endereço cadastrado.</p>";
        return;
      }

      div.innerHTML = `
        <p>${dados.nome || ""}</p>
        <p>${dados.rua}, ${dados.numero}</p>
        <p>${dados.cidade} - ${dados.estado}, CEP ${dados.cep}</p>
        <p>Telefone: ${dados.telefone || "Não informado"}</p>
        <button class="btn-editar-endereco">Editar</button>
      `;
    })
    .catch(() => {
      const div = document.getElementById("dados-endereco");
      if (div) div.innerHTML = "<p>Erro ao carregar endereço.</p>";
    });
});
