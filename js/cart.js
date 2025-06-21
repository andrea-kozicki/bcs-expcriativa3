function esperarUsuarioId(callback) {
  const tentar = () => {
    const id = localStorage.getItem("usuario_id");
    if (id) {
      callback(id);
    } else {
      setTimeout(tentar, 100);
    }
  };
  tentar();
}

document.addEventListener("DOMContentLoaded", () => {
  esperarUsuarioId((usuario_id) => {
    const carrinhoIcon = document.querySelector(".cart-icon");
    const carrinhoDropdown = document.getElementById("cartMenu");
    const contadorCarrinho = document.querySelector(".cart-count");
    const limparCarrinhoBtn = document.getElementById("limparCarrinho");
    const itensCarrinhoList = document.getElementById("cartItems");

    function atualizarContadorCarrinho() {
      const itens = JSON.parse(localStorage.getItem(`cartItems_${usuario_id}`)) || [];
      document.querySelectorAll(".cart-count").forEach(el => el.textContent = itens.length);
    }

    function renderizarItensCarrinho() {
      if (!itensCarrinhoList) return;

      const itens = JSON.parse(localStorage.getItem(`cartItems_${usuario_id}`)) || [];
      itensCarrinhoList.innerHTML = "";

      if (itens.length === 0) {
        const vazio = document.createElement("li");
        vazio.textContent = "Seu carrinho está vazio";
        itensCarrinhoList.appendChild(vazio);
      } else {
        itens.forEach((item, index) => {
          const li = document.createElement("li");
          li.textContent = `${item.titulo || item.nome || "Produto"} - R$ ${item.preco}`;

          const removerBtn = document.createElement("button");
          removerBtn.textContent = "Remover";
          removerBtn.addEventListener("click", () => {
            removerItemCarrinho(index);
          });

          li.appendChild(removerBtn);
          itensCarrinhoList.appendChild(li);
        });
      }
    }

    function removerItemCarrinho(index) {
      let itens = JSON.parse(localStorage.getItem(`cartItems_${usuario_id}`)) || [];
      itens.splice(index, 1);
      localStorage.setItem(`cartItems_${usuario_id}`, JSON.stringify(itens));
      atualizarContadorCarrinho();
      renderizarItensCarrinho();
    }

    if (limparCarrinhoBtn) {
      limparCarrinhoBtn.addEventListener("click", () => {
        localStorage.removeItem(`cartItems_${usuario_id}`);
        atualizarContadorCarrinho();
        renderizarItensCarrinho();
      });
    }

    if (carrinhoIcon && carrinhoDropdown) {
      carrinhoIcon.addEventListener("click", () => {
        carrinhoDropdown.classList.toggle("show");
        renderizarItensCarrinho();
      });
    }

    atualizarContadorCarrinho();
  });
});
