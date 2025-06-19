// ============================================================
// checkout.js - Finalização do pedido + exibição do código
// ============================================================

// 🔁 Remove item do carrinho e atualiza a visualização
function removerItem(index) {
    let itens = JSON.parse(localStorage.getItem('cartItems')) || [];
    itens.splice(index, 1);
    localStorage.setItem('cartItems', JSON.stringify(itens));
    localStorage.setItem('cartCount', itens.length);

    if (typeof atualizarCarrinho === 'function') atualizarCarrinho();
    if (typeof renderizarCarrinho === 'function') renderizarCarrinho();
}

// ============================================================
// Ao carregar a página, identifica qual função executar
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('checkout')) {
        renderizarCarrinho();
        configurarCheckout();
    }

    if (path.includes('pedido-concluido')) {
        exibirCodigoPedido();
    }
});

// ============================================================
// 🛒 Renderiza visual do carrinho
// ============================================================
function renderizarCarrinho() {
    const listaCarrinho = document.getElementById('listaCarrinho');
    const totalCarrinho = document.getElementById('totalCarrinho');
    const itens = JSON.parse(localStorage.getItem('cartItems')) || [];

    if (!listaCarrinho || !totalCarrinho) return;

    let total = 0;
    listaCarrinho.innerHTML = '';

    if (itens.length === 0) {
        listaCarrinho.innerHTML = '<p class="checkout-vazio">Carrinho vazio</p>';
        totalCarrinho.textContent = 'R$ 0,00';
        return;
    }

    itens.forEach((item, index) => {
        const div = document.createElement('div');
        div.classList.add('item-carrinho');

        const info = document.createElement('div');
        info.classList.add('info');
        info.textContent = item.nome;

        const acoes = document.createElement('div');
        acoes.classList.add('acoes');

        const preco = document.createElement('span');
        const precoNumerico = parseFloat(item.preco.replace('R$', '').replace(',', '.'));
        preco.textContent = `R$ ${precoNumerico.toFixed(2).replace('.', ',')}`;

        const excluirBtn = document.createElement('button');
        excluirBtn.classList.add('btn-remove-menu');
        excluirBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        excluirBtn.addEventListener('click', () => {
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

    totalCarrinho.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// ============================================================
// ⚙️ Configura botões: limpar carrinho e finalizar compra
// ============================================================
function configurarCheckout() {
    const limparCheckout = document.getElementById('limparCheckout');
    const finalizarCompra = document.getElementById('finalizarCompra');

    if (limparCheckout) {
        limparCheckout.addEventListener('click', () => {
            localStorage.removeItem('cartItems');
            localStorage.removeItem('cartCount');
            renderizarCarrinho();
            if (typeof atualizarCarrinho === 'function') atualizarCarrinho();
            alert('Carrinho limpo com sucesso!');
        });
    }

    if (finalizarCompra) {
        finalizarCompra.addEventListener('click', () => {
            const itens = JSON.parse(localStorage.getItem('cartItems')) || [];

            if (itens.length === 0) {
                alert('Seu carrinho está vazio.');
                return;
            }

            fetch('/php/processar_compra.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ carrinho: itens })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.sucesso) {
                        localStorage.removeItem('cartItems');
                        localStorage.removeItem('cartCount');

                        if (typeof renderizarCarrinho === 'function') renderizarCarrinho();
                        if (typeof atualizarCarrinho === 'function') atualizarCarrinho();

                        // Redireciona para a página de pedido concluído
                        window.location.href = `pedido-concluido.html?codigo=${data.codigo_pedido}`;
                    } else {
                        alert('Erro: ' + data.erro);
                    }
                })
                .catch(error => {
                    console.error('Erro na requisição:', error);
                    alert('Falha ao enviar dados da compra.');
                });
        });
    }
}

// ============================================================
// ✅ Exibe o código do pedido em pedido-concluido.html
// ============================================================
function exibirCodigoPedido() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('codigo');

    const spanCodigo = document.getElementById('codigoPedido');
    const verPedidos = document.getElementById('verPedidos');

    if (codigo && spanCodigo) {
        spanCodigo.textContent = codigo;

        if (verPedidos) {
            verPedidos.href = `/pedidos.html?codigo=${codigo}`;
        }
    } else {
        const container = document.querySelector('.checkout-container');
        if (container) {
            container.innerHTML = '<h2>Não foi possível localizar o número do pedido.</h2>';
        }
    }
}
