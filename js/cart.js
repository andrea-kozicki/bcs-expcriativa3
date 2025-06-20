document.addEventListener("DOMContentLoaded", () => {
  const usuario_id = localStorage.getItem("usuario_id") || "anonimo";
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
    const itens = JSON.parse(localStorage.getItem(`cartItems_${usuario_id}`)) || [];
    if (!itensCarrinhoList) return;

    itensCarrinhoList.innerHTML = "";

    if (itens.length === 0) {
      const vazio = document.createElement("li");
      vazio.textContent = "Carrinho vazio";
      vazio.style.padding = "0.5rem";
      itensCarrinhoList.appendChild(vazio);
    } else {
      itens.forEach((item, index) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.padding = "0.5rem";

        const span = document.createElement("span");
        span.textContent = `${item.nome || item.titulo} - ${item.preco}`;

        const remover = document.createElement("button");
        remover.textContent = "X";
        remover.style.background = "transparent";
        remover.style.border = "none";
        remover.style.color = "red";
        remover.style.cursor = "pointer";
        remover.style.fontSize = "14px";
        remover.addEventListener("click", () => {
          itens.splice(index, 1);
          localStorage.setItem(`cartItems_${usuario_id}`, JSON.stringify(itens));
          atualizarContadorCarrinho();
          renderizarItensCarrinho();
        });

        li.appendChild(span);
        li.appendChild(remover);
        itensCarrinhoList.appendChild(li);
      });
    }
  }

  if (carrinhoIcon && carrinhoDropdown) {
    carrinhoIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      carrinhoDropdown.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!carrinhoDropdown.contains(e.target) && !carrinhoIcon.contains(e.target)) {
        carrinhoDropdown.classList.remove("show");
      }
    });
  }

  if (limparCarrinhoBtn) {
    limparCarrinhoBtn.addEventListener("click", () => {
      localStorage.removeItem(`cartItems_${usuario_id}`);
      atualizarContadorCarrinho();
      renderizarItensCarrinho();
    });
  }

  // Atualiza a cada 1 segundo, até aparecer o contador
  let tentativas = 0;
  const intervalo = setInterval(() => {
    const contador = document.querySelector(".cart-count");
    if (contador) {
      atualizarContadorCarrinho();
      clearInterval(intervalo);
    }
    if (++tentativas > 10) clearInterval(intervalo); // para evitar loop eterno
  }, 1000);

  atualizarContadorCarrinho();
  renderizarItensCarrinho();
});
