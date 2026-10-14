(function () {
  const CHAVE_PRODUTOS = "gavstore.produtos";
  const ESTOQUE_DEMONSTRACAO = 10;
  const produtosIniciais = [
    { id: "flare", nome: "Conjunto de Flare", preco: 89.9, imagem: "imagens/flare.png", estoque: ESTOQUE_DEMONSTRACAO, destaque: true },
    { id: "corrida", nome: "Conjuntos de Corrida", preco: 129.9, imagem: "imagens/figma/corredor-pista.png", estoque: ESTOQUE_DEMONSTRACAO, destaque: true },
    { id: "canelado", nome: "Conjunto Canelado", preco: 99.9, imagem: "imagens/figma/conjunto-leggings-coral.png", estoque: ESTOQUE_DEMONSTRACAO, destaque: true },
    { id: "top-alca-x", nome: "Top de Alça em X", preco: 159.9, imagem: "imagens/figma/top-preto-alca-x.png", estoque: ESTOQUE_DEMONSTRACAO, destaque: true },
    { id: "jaquetas", nome: "Jaquetas", preco: 159.9, imagem: "imagens/figma/atleta-jaqueta-urbana.png", estoque: ESTOQUE_DEMONSTRACAO, destaque: true },
    { id: "regatas-dry-fit", nome: "Regatas Dry Fit", preco: 59.9, imagem: "imagens/regata dry.png", estoque: ESTOQUE_DEMONSTRACAO, destaque: true },
  ];
  const formatoMoeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  function validarProdutos(produtos) {
    if (
      !Array.isArray(produtos) ||
      produtos.some(
        (produto) =>
          !produto ||
          typeof produto.id !== "string" ||
          typeof produto.nome !== "string" ||
          !Array.isArray(produto.imagens) ||
          produto.imagens.length === 0 ||
          produto.imagens.some(
            (imagem) =>
              !imagem ||
              typeof imagem.src !== "string" ||
              imagem.src.trim() === "" ||
              !Number.isFinite(imagem.zoom) ||
              imagem.zoom < 100 ||
              imagem.zoom > 250 ||
              !Number.isFinite(imagem.x) ||
              imagem.x < 0 ||
              imagem.x > 100 ||
              !Number.isFinite(imagem.y) ||
              imagem.y < 0 ||
              imagem.y > 100
          ) ||
          !Number.isFinite(produto.preco) ||
          produto.preco <= 0 ||
          !Number.isSafeInteger(produto.estoque) ||
          produto.estoque < 0
      )
    ) {
      throw new Error("Os dados salvos do catálogo estão inválidos.");
    }
  }

  function obterProdutos() {
    const conteudo = localStorage.getItem(CHAVE_PRODUTOS);
    if (conteudo === null) {
      return produtosIniciais.map((produto) => ({
        ...produto,
        imagens: [{ src: produto.imagem, zoom: 100, x: 50, y: 50 }],
      }));
    }

    const produtos = JSON.parse(conteudo);
    if (!Array.isArray(produtos)) {
      throw new Error("Os dados salvos do catálogo estão inválidos.");
    }

    const produtosAtualizados = produtos.map((produto) => {
      const imagensAntigas = Array.isArray(produto.imagens) && produto.imagens.length
        ? produto.imagens
        : [produto.imagem];
      return {
        ...produto,
        estoque: produto.estoque === undefined ? ESTOQUE_DEMONSTRACAO : produto.estoque,
        imagens: imagensAntigas.map((imagem) =>
          typeof imagem === "string"
            ? { src: imagem, zoom: 100, x: 50, y: 50 }
            : { zoom: 100, x: 50, y: 50, ...imagem }
        ),
      };
    });
    for (const produto of produtosAtualizados) {
      produto.imagem = produto.imagens[0].src;
    }
    validarProdutos(produtosAtualizados);
    return produtosAtualizados;
  }

  function salvarProdutos(produtos) {
    validarProdutos(produtos);
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
  }

  function criarCartao(produto) {
    const cartao = document.createElement("article");
    cartao.className = "card";

    const galeria = document.createElement("div");
    galeria.className = "galeria-card-produto";
    const quadroImagem = document.createElement("div");
    quadroImagem.className = "quadro-imagem-principal";
    const imagem = document.createElement("img");
    imagem.className = "imagem-principal-produto";
    imagem.src = produto.imagens[0].src;
    imagem.alt = produto.nome;
    imagem.loading = "lazy";
    imagem.style.objectPosition = `${produto.imagens[0].x}% ${produto.imagens[0].y}%`;
    imagem.style.transform = `scale(${produto.imagens[0].zoom / 100})`;
    quadroImagem.append(imagem);
    galeria.append(quadroImagem);

    if (produto.imagens.length > 1) {
      const miniaturas = document.createElement("div");
      miniaturas.className = "miniaturas-produto";
      miniaturas.setAttribute("aria-label", `Outras imagens de ${produto.nome}`);
      produto.imagens.forEach((imagemProduto, indice) => {
        const botaoImagem = document.createElement("button");
        botaoImagem.className = `miniatura-produto${indice === 0 ? " selecionada" : ""}`;
        botaoImagem.type = "button";
        botaoImagem.dataset.imagemGaleria = "";
        botaoImagem.dataset.produtoId = produto.id;
        botaoImagem.dataset.indiceImagem = String(indice);
        botaoImagem.setAttribute("aria-label", `Ver imagem ${indice + 1} de ${produto.imagens.length} de ${produto.nome}`);
        botaoImagem.setAttribute("aria-pressed", String(indice === 0));
        const miniatura = document.createElement("img");
        miniatura.src = imagemProduto.src;
        miniatura.alt = "";
        miniatura.loading = "lazy";
        miniatura.style.objectPosition = `${imagemProduto.x}% ${imagemProduto.y}%`;
        miniatura.style.transform = `scale(${imagemProduto.zoom / 100})`;
        botaoImagem.append(miniatura);
        miniaturas.append(botaoImagem);
      });
      galeria.append(miniaturas);
    }

    const nome = document.createElement("h3");
    nome.textContent = produto.nome;

    const preco = document.createElement("p");
    preco.className = "preco";
    preco.textContent = formatoMoeda.format(produto.preco);

    if (produto.destaque) {
      const etiqueta = document.createElement("span");
      etiqueta.className = "etiqueta";
      etiqueta.textContent = "Mais vendido";
      cartao.append(galeria, nome, preco, etiqueta);
    } else {
      cartao.append(galeria, nome, preco);
    }

    const estoque = document.createElement("p");
    estoque.className = `estoque-produto${produto.estoque === 0 ? " sem-estoque" : ""}`;
    estoque.textContent = produto.estoque > 0 ? `${produto.estoque} em estoque` : "Indisponível";

    const botao = document.createElement("button");
    botao.className = "botao-carrinho";
    botao.type = "button";
    botao.dataset.adicionarCarrinho = "";
    botao.dataset.nome = produto.nome;
    botao.dataset.preco = String(produto.preco);
    botao.dataset.imagem = produto.imagem;
    botao.dataset.produtoId = produto.id;
    botao.disabled = produto.estoque === 0;
    botao.textContent = produto.estoque > 0 ? "Adicionar ao carrinho" : "Sem estoque";

    cartao.append(estoque, botao);
    return cartao;
  }

  function renderizarProdutos() {
    const lista = document.querySelector("#lista-produtos");
    if (!lista) {
      return;
    }

    const aviso = document.querySelector("#aviso-produtos");
    try {
      const produtos = obterProdutos();
      lista.replaceChildren(...produtos.map(criarCartao));
      if (aviso) {
        aviso.textContent = "";
      }
    } catch (erro) {
      if (aviso) {
        aviso.textContent = `Não foi possível carregar os produtos. ${erro.message}`;
      }
      console.error("Falha ao carregar o catálogo da GAV Store.", erro);
    }
  }

  window.GAVCatalogo = Object.freeze({
    obterProdutos,
    salvarProdutos,
    chave: CHAVE_PRODUTOS,
  });

  document.querySelector("#lista-produtos")?.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-imagem-galeria]");
    if (!botao) {
      return;
    }

    try {
      const produto = obterProdutos().find((item) => item.id === botao.dataset.produtoId);
      const indice = Number(botao.dataset.indiceImagem);
      const imagemSelecionada = produto?.imagens[indice];
      if (!produto || !Number.isInteger(indice) || !imagemSelecionada) {
        throw new Error("A imagem selecionada não está disponível no catálogo.");
      }

      const cartao = botao.closest(".card");
      const imagemPrincipal = cartao.querySelector(".imagem-principal-produto");
      imagemPrincipal.src = imagemSelecionada.src;
      imagemPrincipal.style.objectPosition = `${imagemSelecionada.x}% ${imagemSelecionada.y}%`;
      imagemPrincipal.style.transform = `scale(${imagemSelecionada.zoom / 100})`;
      cartao.querySelectorAll("[data-imagem-galeria]").forEach((miniatura) => {
        const selecionada = miniatura === botao;
        miniatura.classList.toggle("selecionada", selecionada);
        miniatura.setAttribute("aria-pressed", String(selecionada));
      });
    } catch (erro) {
      console.error("Não foi possível exibir a imagem do produto.", erro);
    }
  });

  renderizarProdutos();
  window.addEventListener("storage", (evento) => {
    if (evento.key === CHAVE_PRODUTOS) {
      renderizarProdutos();
    }
  });
})();
