document.addEventListener("DOMContentLoaded", () => {
  const usuario_id = localStorage.getItem("usuario_id");
  if (!usuario_id) {
    console.log("Usuário não logado. Carrinho desativado.");
    return;
  }

  console.log("cart.js carregado, usuario_id:", usuario_id);

  const cartIcon = document.querySelector(".cart-icon");
  const cartMenu = document.getElementById("cartMenu");
  const cartItemsList = document.getElementById("cartItems");
  const cartCount = document.querySelector(".cart-count");

  if (!cartIcon || !cartMenu || !cartItemsList || !cartCount) {
    console.warn("Elementos do carrinho não encontrados.");
    return;
  }

  cartIcon.addEventListener("click", () => {
    cartMenu.classList.toggle("hidden");
  });

  function atualizarCarrinho() {
    const cartData = JSON.parse(localStorage.getItem(`cartItems_${usuario_id}`) || "[]");
    cartItemsList.innerHTML = "";
    cartCount.textContent = cartData.length;

    cartData.forEach((item, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${item.titulo} - R$ ${item.preco}
        <button onclick="removerItem(${index})">x</button>
      `;
      cartItemsList.appendChild(li);
    });
  }

  window.removerItem = function (index) {
    const cartData = JSON.parse(localStorage.getItem(`cartItems_${usuario_id}`) || "[]");
    cartData.splice(index, 1);
    localStorage.setItem(`cartItems_${usuario_id}`, JSON.stringify(cartData));
    atualizarCarrinho();
  };

  const limparBtn = document.getElementById("limparCarrinho");
  if (limparBtn) {
    limparBtn.addEventListener("click", () => {
      localStorage.removeItem(`cartItems_${usuario_id}`);
      atualizarCarrinho();
    });
  }

  atualizarCarrinho();
});
