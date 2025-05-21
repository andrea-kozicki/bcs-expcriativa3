(() => {
  const livros = [
    { id: 1, titulo: "A Culpa é das Estrelas", preco: "R$ 47,99", descricao: "'Dois adolescentes que se conhecem em um grupo de apoio para jovens com câncer.'", imagem: "./imagens/Rom1.jpg" },
    { id: 2, titulo: "Amor Sob Encomenda", preco: "R$ 45,90", descricao: "'Encontros inesperados e como o destino pode mudar nossas vidas no momento certo.'", imagem: "./imagens/Rom2.jpg" },
    { id: 3, titulo: "Luzes do Norte", preco: "R$ 50,90", descricao: "'Uma história envolvente de aventura e mistério sob a aurora boreal.'", imagem: "./imagens/Rom3.jpg" },
    { id: 4, titulo: "P.S. Eu te amo", preco: "R$ 20,50", descricao: "'Uma história de amor e perda, onde Holly encontra cartas deixadas por seu falecido marido.'", imagem: "./imagens/Rom4.jpg" },
    { id: 5, titulo: "Orgulho e Preconceito", preco: "R$ 47,97", descricao: "'A relação entre Elizabeth Bennet e Sr. Darcy, com ironia e críticas à sociedade da época.'", imagem: "./imagens/Rom5.jpg" },
    { id: 6, titulo: "A Cabeça de Steve Jobs", preco: "R$ 89,90", descricao: "'Um mergulho na mente brilhante de Steve Jobs, explorando sua abordagem visionária.'", imagem: "./imagens/Bio1.jpg" },
    { id: 7, titulo: "A Loja de Tudo", preco: "R$ 40,30", descricao: "'A trajetória da Amazon e de Jeff Bezos, e como ela revolucionou o comércio eletrônico.'", imagem: "./imagens/Bio2.jpg" },
    { id: 8, titulo: "Minha Breve História", preco: "R$ 44,50", descricao: "'A autobiografia de Stephen Hawking, onde ele compartilha sua trajetória desde a infância.'", imagem: "./imagens/Bio3.jpg" },
    { id: 9, titulo: "Eu Sou Malala", preco: "R$ 46,99", descricao: "'A história de Malala Yousafzai, a paquistanesa que desafiou o Talibã em defesa da educação.'", imagem: "./imagens/Bio4.jpg" },
    { id: 10, titulo: "Bilionários por Acaso", preco: "R$ 25,00", descricao: "'A criação do Facebook, as disputas e ambições por trás da maior rede social do mundo.'", imagem: "./imagens/Bio5.jpg" }
  ];

  const livroId = new URLSearchParams(window.location.search).get("id");
  const livroSelecionado = livros.find(livro => livro.id == livroId);

  if (livroSelecionado) {
    document.getElementById("produto-imagem").src = livroSelecionado.imagem;
    document.getElementById("produto-nome").textContent = livroSelecionado.titulo;
    document.getElementById("produto-preco").textContent = livroSelecionado.preco;
    document.getElementById("produto-descricao").textContent = livroSelecionado.descricao;
    document.title = livroSelecionado.titulo;
  } else {
    document.body.innerHTML = "<h1>Livro não encontrado</h1>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    const addCarrinhoBtn = document.getElementById("addCarrinho");
    const cartCountSpan = document.querySelector(".cart-count");

    function atualizarCarrinho() {
      const items = JSON.parse(localStorage.getItem("cartItems")) || [];
      if (cartCountSpan) cartCountSpan.textContent = items.length;
    }

    atualizarCarrinho();

    if (addCarrinhoBtn && livroSelecionado) {
      addCarrinhoBtn.addEventListener("click", function () {
        const items = JSON.parse(localStorage.getItem("cartItems")) || [];
        items.push({
          nome: livroSelecionado.titulo,
          preco: livroSelecionado.preco
        });
        localStorage.setItem("cartItems", JSON.stringify(items));
        atualizarCarrinho();
        alert(`"${livroSelecionado.titulo}" adicionado ao carrinho!`);
      });
    }

    const voltarBtn = document.getElementById("voltarBtn");
    if (voltarBtn) {
      voltarBtn.addEventListener("click", function () {
        window.history.back();
      });
    }
  });
})();
