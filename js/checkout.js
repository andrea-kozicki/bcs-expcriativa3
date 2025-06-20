// ============================================================
// checkout.js - Finalização do pedido por usuário
// ============================================================

function removerItem(index) {
    const usuario_id = localStorage.getItem("usuario_id") || "anonimo";
    let itens = JSON.parse(localStorage.getItem(`cartItems_${usuario_id}`)) || [];
    itens.splice(index, 1);
    localStorage.setItem(`cartItems_${usuario_id}`, JSON.stringify(itens));
    localStorage.setItem("cartCount", itens.length);

    if (typeof atualizarCarrinho === "function") atualizarCarrinho();
    if (typeof renderizarCarrinho === "function") renderizarCarrinho();
}

window.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;

    if (path.includes("checkout")) {
        renderizarCarrinho();
        configurarCheckout();
    }

    if (path.includes("pedido-concluido")) {
        exibirCodigoPedido();
    }
});

function renderizarCarrinho() {
    const usuario_id = localStorage.getItem("usuario_id") || "anonimo";
    const listaCarrinho = document.getElementById("listaCarrinho");
    const totalCarrinho = document.getElementById("totalCarrinho");
    const itens = JSON.parse(localStorage.getItem(`cartItems_${usuario_id}`)) || [];

    if (!listaCarrinho || !totalCarrinho) return;

    let total = 0;
    listaCarrinho.innerHTML = "";

    if (itens.length === 0) {
        listaCarrinho.innerHTML = '<p class="checkout-vazio">Carrinho vazio</p>';
        totalCarrinho.textContent = "R$ 0,00";
        return;
    }

    itens.forEach((item, index) => {
        const div = document.createElement("div");
        div.classList.add("item-carrinho");

        const info = document.createElement("div");
        info.classList.add("info");
        info.textContent = item.nome || item.titulo || "Produto";

        const acoes = document.createElement("div");
        acoes.classList.add("acoes");

        const preco = document.createElement("span");
        const precoNumerico = parseFloat((item.preco || "0").replace("R$", "").replace(",", "."));
        preco.textContent = `R$ ${precoNumerico.toFixed(2).replace(".", ",")}`;

        const excluirBtn = document.createElement("button");
        excluirBtn.classList.add("btn-remove-menu");
        excluirBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        excluirBtn.addEventListener("click", () => {
            removerItem(index);
        });

        acoes.appendChild(preco);
        acoes.appendChild(excluirBtn);
        div.appendChild(info);
        div.appendChild(acoes);
        listaCarrinho.appendChild(div);

        if (!isNaN(precoNumerico)) {
            total += precoNumerico;
        }
    });

    totalCarrinho.textContent = `R$ ${total.toFixed(2).replace(".", ",")}`;
}

function configurarCheckout() {
    const usuario_id = localStorage.getItem("usuario_id") || "anonimo";
    const limparCheckout = document.getElementById("limparCheckout");
    const finalizarCompra = document.getElementById("finalizarCompra");

    if (limparCheckout) {
        limparCheckout.addEventListener("click", () => {
            localStorage.removeItem(`cartItems_${usuario_id}`);
            localStorage.removeItem("cartCount");
            renderizarCarrinho();
            if (typeof atualizarCarrinho === "function") atualizarCarrinho();
            alert("Carrinho limpo com sucesso!");
        });
    }

    if (finalizarCompra) {
        finalizarCompra.addEventListener("click", () => {
            const itens = JSON.parse(localStorage.getItem(`cartItems_${usuario_id}`)) || [];

            if (!usuario_id || usuario_id === "anonimo") {
                alert("Erro: usuário não identificado.");
                return;
            }

            if (itens.length === 0) {
                alert("Seu carrinho está vazio.");
                return;
            }

            fetch("/php/processar_compra.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ usuario_id, carrinho: itens })
            })
                .then(response => {
                    if (!response.ok) throw new Error("Erro na requisição: " + response.status);
                    return response.json();
                })
                .then(data => {
                    if (data.sucesso) {
                        localStorage.removeItem(`cartItems_${usuario_id}`);
                        localStorage.removeItem("cartCount");

                        if (typeof renderizarCarrinho === "function") renderizarCarrinho();
                        if (typeof atualizarCarrinho === "function") atualizarCarrinho();

                        window.location.href = `pedido-concluido.html?codigo=${data.codigo_pedido}`;
                    } else {
                        alert("Erro: " + data.erro);
                    }
                })
                .catch(error => {
                    console.error("Erro na requisição:", error);
                    alert("Falha ao enviar dados da compra.");
                });
        });
    }
}

function exibirCodigoPedido() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get("codigo");

    const spanCodigo = document.getElementById("codigoPedido");
    const verPedidos = document.getElementById("verPedidos");

    if (codigo && spanCodigo) {
        spanCodigo.textContent = codigo;
        if (verPedidos) verPedidos.href = `/pedidos.html?codigo=${codigo}`;
    } else {
        const container = document.querySelector(".checkout-container");
        if (container) {
            container.innerHTML = '<h2>Não foi possível localizar o número do pedido.</h2>';
        }
    }
}
