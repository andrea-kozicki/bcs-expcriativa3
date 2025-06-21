document.addEventListener("DOMContentLoaded", () => {
  const esperarUsuarioId = () => {
    return new Promise((resolve) => {
      const verificar = () => {
        const id = localStorage.getItem("usuario_id");
        if (id) {
          resolve(id);
        } else {
          setTimeout(verificar, 100); // tenta de novo em 100ms
        }
      };
      verificar();
    });
  };

  esperarUsuarioId().then((usuario_id) => {
    console.log("cart.js: usuario_id disponível:", usuario_id);

    const cartIcon = document.querySelector(".cart-icon");
    const cartMenu = document.getElementById("cartMenu");
    const cartCount = document.querySelector(".cart-count");
    const cartItemsContainer = document.getElementById("cartItems");
    const limparBtn = document.getElementById("limparCarrinho");
    const checkoutBtn = document.querySelector(".btn-success");

    if (!cartIcon || !cartMenu || !cartCount || !cartItemsContainer) return;

    const obterCarrinho = () => {
      const dados = localStorage.getItem(`cartItems_${usuario_id}`) || "[]";
      try {
        return JSON.parse(dados);
      } catch {
        return [];
      }
    };

    const salvarCarrinho = (itens) => {
      localStorage.setItem(`cartItems_${usuario_id}`, JSON.stringify(itens));
    };

    const atualizarVisual = () => {
      const itens = obterCarrinho();
      cartItemsContainer.innerHTML = "";

      if (itens.length === 0) {
        cartItemsContainer.innerHTML = "<li>Carrinho vazio</li>";
      } else {
        itens.forEach((item, index) => {
          const li = document.createElement("li");
          li.innerHTML = `
            ${item.titulo} - ${item.quantidade}x R$ ${item.preco}
            <button data-index="${index}" class="remover-item">X</button>
          `;
          cartItemsContainer.appendChild(li);
        });
      }

      cartCount.textContent = itens.reduce((acc, item) => acc + item.quantidade, 0);
    };

    cartIcon.addEventListener("click", () => {
      console.log("Clicou no ícone do carrinho");
      cartMenu.classList.toggle("show");
      atualizarVisual();
    });

    cartItemsContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("remover-item")) {
        const index = parseInt(e.target.dataset.index);
        const itens = obterCarrinho();
        itens.splice(index, 1);
        salvarCarrinho(itens);
        atualizarVisual();
      }
    });

    if (limparBtn) {
      limparBtn.addEventListener("click", () => {
        localStorage.setItem(`cartItems_${usuario_id}`, "[]");
        atualizarVisual();
      });
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", (e) => {
        if (!usuario_id) {
          e.preventDefault();
          alert("Você precisa estar logado para finalizar a compra.");
        }
      });
    }

    atualizarVisual();
  });
});
