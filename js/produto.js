document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const id = Number(urlParams.get("id"));

const livros = [
  { id: 1, titulo: "A Culpa é das Estrelas", preco: "R$ 47,99", descricao: "Dois adolescentes que se conhecem em um grupo de apoio para jovens com câncer.", imagem: "./imagens/Rom1.jpg" },
  { id: 2, titulo: "Amor Sob Encomenda", preco: "R$ 45,90", descricao: "Encontros inesperados e como o destino pode mudar nossas vidas no momento certo.", imagem: "./imagens/Rom2.jpg" },
  { id: 3, titulo: "Luzes do Norte", preco: "R$ 50,90", descricao: "Uma história envolvente de aventura e mistério sob a aurora boreal.", imagem: "./imagens/Rom3.jpg" },
  { id: 4, titulo: "P.S. Eu te amo", preco: "R$ 20,50", descricao: "Uma história de amor e perda, onde Holly encontra cartas deixadas por seu falecido marido.", imagem: "./imagens/Rom4.jpg" },
  { id: 5, titulo: "Orgulho e Preconceito", preco: "R$ 47,97", descricao: "A relação entre Elizabeth Bennet e Sr. Darcy, com ironia e críticas à sociedade da época.", imagem: "./imagens/Rom5.jpg" },
  { id: 6, titulo: "A Cabeça de Steve Jobs", preco: "R$ 89,90", descricao: "Um mergulho na mente brilhante de Steve Jobs, explorando sua abordagem visionária.", imagem: "./imagens/Bio1.jpg" },
  { id: 7, titulo: "A Loja de Tudo", preco: "R$ 40,30", descricao: "A trajetória da Amazon e de Jeff Bezos, e como ela revolucionou o comércio eletrônico.", imagem: "./imagens/Bio2.jpg" },
  { id: 8, titulo: "Minha Breve História", preco: "R$ 44,50", descricao: "A autobiografia de Stephen Hawking, onde ele compartilha sua trajetória desde a infância.", imagem: "./imagens/Bio3.jpg" },
  { id: 9, titulo: "Eu Sou Malala", preco: "R$ 46,99", descricao: "A história de Malala Yousafzai, a paquistanesa que desafiou o Talibã em defesa da educação.", imagem: "./imagens/Bio4.jpg" },
  { id: 10, titulo: "Bilionários por Acaso", preco: "R$ 25,00", descricao: "A criação do Facebook, as disputas e ambições por trás da maior rede social do mundo.", imagem: "./imagens/Bio5.jpg" },
  { id: 11, titulo: "A Redoma de Vidro", preco: "R$ 42,90", descricao: "A luta de uma jovem brilhante contra a depressão e a sociedade opressiva dos anos 1950.", imagem: "./imagens/Poesia1.jpeg" },
  { id: 12, titulo: "A Morte de Ivan Ilitch", preco: "R$ 26,50", descricao: "Explorando a morte e a reflexão sobre uma vida desperdiçada em futilidades.", imagem: "./imagens/Poesia2.jpeg" },
  { id: 13, titulo: "Crime e Castigo", preco: "R$ 62,00", descricao: "A jornada psicológica de Raskólnikov após cometer um assassinato.", imagem: "./imagens/Poesia3.jpg" },
  { id: 14, titulo: "Nos Cumes do Desespero", preco: "R$ 99,90", descricao: "Uma reflexão sobre o sofrimento, a existência e a angústia humana.", imagem: "./imagens/Poesia4.jpeg" },
  { id: 15, titulo: "Lira dos Vinte Anos", preco: "R$ 47,36", descricao: "Poesias de Álvares de Azevedo, repleta de melancolia e paixão.", imagem: "./imagens/Poesia5.jpg" },
  { id: 16, titulo: "Tripulação de Esqueletos", preco: "R$ 79,90", descricao: "Uma coletânea de contos de Stephen King, trazendo histórias macabras e perturbadoras.", imagem: "./imagens/Contos1.jpg" },
  { id: 17, titulo: "O Telefone Preto e Outras Histórias", preco: "R$ 45,90", descricao: "Uma coletânea de Joe Hill, com narrativas aterrorizantes e sobrenaturais.", imagem: "./imagens/Contos2.jpg" },
  { id: 18, titulo: "Doze Reis e a Moça do Labirinto do Vento", preco: "R$ 47,60", descricao: "Um livro de contos de Marina Colasanti, misturando fábulas e lirismo.", imagem: "./imagens/Contos3.jpg" },
  { id: 19, titulo: "Olhos D'Água", preco: "R$ 35,90", descricao: "Aborda a vida de mulheres negras em meio a desafios sociais e emocionais.", imagem: "./imagens/Contos4.jpeg" },
  { id: 20, titulo: "Alerta de Risco", preco: "R$ 27,30", descricao: "Contos de Neil Gaiman que transitam entre o terror, a fantasia e Sci-Fi.", imagem: "./imagens/Contos5.jpg" }
];

const produto = livros.find(p => p.id === id);

  if (!produto) {
    alert("Produto não encontrado.");
    return;
  }

  // Preenche os dados do produto na página
  document.getElementById("produto-nome").textContent = produto.titulo;
  document.getElementById("produto-preco").textContent = produto.preco;
  document.getElementById("produto-descricao").textContent = produto.descricao;
  document.getElementById("produto-imagem").src = produto.imagem;
  document.getElementById("produto-imagem").alt = produto.titulo;

  const botaoAdicionar = document.getElementById("addCarrinho");
  const usuario_id = localStorage.getItem("usuario_id") || "anonimo";

  // Adiciona ao carrinho corretamente com cartItems_<usuario_id>
  botaoAdicionar?.addEventListener("click", () => {
    let carrinho = JSON.parse(localStorage.getItem(`cartItems_${usuario_id}`)) || [];
    const existente = carrinho.find(item => item.titulo === produto.titulo);

    if (existente) {
      existente.quantidade += 1;
    } else {
      carrinho.push({
        id: produto.id,
        titulo: produto.titulo,
        preco: produto.preco,
        quantidade: 1
      });
    }

    localStorage.setItem(`cartItems_${usuario_id}`, JSON.stringify(carrinho));

    if (typeof atualizarContadorCarrinho === "function") {
      atualizarContadorCarrinho();
    }

    alert("Produto adicionado ao carrinho!");
  });

  // Botão voltar
  const botaoVoltar = document.getElementById("voltarBtn");
  botaoVoltar?.addEventListener("click", () => history.back());

  // Atualiza o contador corretamente
  function atualizarContadorCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem(`cartItems_${usuario_id}`)) || [];
    const total = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const contador = document.querySelector(".cart-count");
    if (contador) {
      contador.textContent = total;
    }
  }

  atualizarContadorCarrinho();
});