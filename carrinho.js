const CHAVE_CARRINHO = "gavstore.carrinho";
const CHAVE_PERFIL = "gavstore.perfil";
const CHAVE_ENTREGA = "gavstore.entrega";
const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function lerCarrinho() {
  const conteudo = localStorage.getItem(CHAVE_CARRINHO);
  const itens = conteudo ? JSON.parse(conteudo) : [];

  if (
    !Array.isArray(itens) ||
    itens.some(
      (item) =>
        !item ||
        typeof item.nome !== "string" ||
        typeof item.imagem !== "string" ||
        !Number.isFinite(item.preco) ||
        !Number.isInteger(item.quantidade) ||
        item.quantidade < 1
    )
  ) {
    throw new Error("Os dados salvos do carrinho estão inválidos.");
  }

  if (window.GAVCatalogo) {
    const produtos = window.GAVCatalogo.obterProdutos();
    for (const item of itens) {
      const produtoAtual = produtos.find((produto) =>
        item.produtoId ? produto.id === item.produtoId : produto.nome === item.nome
      );
      if (produtoAtual) {
        item.produtoId = produtoAtual.id;
        item.nome = produtoAtual.nome;
        item.preco = produtoAtual.preco;
        item.imagem = produtoAtual.imagem;
      }
    }
  }

  return itens;
}

function salvarCarrinho(itens) {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
}

function mostrarErroCarrinho(mensagem) {
  const aviso = document.querySelector("#aviso-carrinho");
  if (aviso) {
    aviso.textContent = mensagem;
  } else {
    window.alert(mensagem);
  }
}

function renderizarResumoPerfil() {
  const resumo = document.querySelector("#perfil-resumo-carrinho");
  if (!resumo) {
    return;
  }

  try {
    const itens = lerCarrinho();
    const quantidade = itens.reduce((total, item) => total + item.quantidade, 0);
    const subtotal = itens.reduce((total, item) => total + item.preco * item.quantidade, 0);
    resumo.textContent = itens.length
      ? `Seu carrinho tem ${quantidade} ${quantidade === 1 ? "item" : "itens"} · ${formatoMoeda.format(subtotal)}.`
      : "Seu carrinho está vazio. Explore os produtos para começar.";
  } catch (erro) {
    resumo.textContent = `Não foi possível carregar o carrinho. ${erro.message}`;
  }
}

function renderizarCarrinho() {
  const lista = document.querySelector("#lista-carrinho");
  if (!lista) {
    renderizarResumoPerfil();
    return;
  }

  const itens = lerCarrinho();
  const total = itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  lista.replaceChildren();

  if (itens.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "carrinho-vazio";
    vazio.textContent = "Seu carrinho está vazio. Escolha seus produtos para continuar.";
    lista.append(vazio);
  }

  itens.forEach((item, indice) => {
    const linha = document.createElement("article");
    linha.className = "item-carrinho";

    const imagem = document.createElement("img");
    imagem.src = item.imagem;
    imagem.alt = "";
    imagem.width = 88;
    imagem.height = 104;

    const detalhes = document.createElement("div");
    detalhes.className = "detalhes-item-carrinho";

    const nome = document.createElement("h3");
    nome.textContent = item.nome;

    const preco = document.createElement("p");
    preco.textContent = formatoMoeda.format(item.preco);

    const quantidade = document.createElement("label");
    quantidade.textContent = "Quantidade ";
    const campoQuantidade = document.createElement("input");
    const produtoAtual = window.GAVCatalogo?.obterProdutos().find((produto) =>
      item.produtoId ? produto.id === item.produtoId : produto.nome === item.nome
    );
    campoQuantidade.type = "number";
    campoQuantidade.min = "1";
    campoQuantidade.max = String(Math.max(produtoAtual?.estoque ?? item.quantidade, item.quantidade));
    campoQuantidade.value = String(item.quantidade);
    campoQuantidade.setAttribute("aria-label", `Quantidade de ${item.nome}`);
    campoQuantidade.dataset.quantidadeItem = String(indice);
    quantidade.append(campoQuantidade);

    if (produtoAtual && item.quantidade > produtoAtual.estoque) {
      const avisoEstoque = document.createElement("p");
      avisoEstoque.className = "aviso-estoque-carrinho";
      avisoEstoque.textContent =
        produtoAtual.estoque > 0
          ? `Estoque atualizado: reduza para ${produtoAtual.estoque} ${produtoAtual.estoque === 1 ? "unidade" : "unidades"} ou menos.`
          : "Este produto está sem estoque. Remova-o do carrinho para continuar.";
      detalhes.append(avisoEstoque);
    } else if (!produtoAtual) {
      const avisoEstoque = document.createElement("p");
      avisoEstoque.className = "aviso-estoque-carrinho";
      avisoEstoque.textContent = "Este produto não está mais disponível no catálogo.";
      detalhes.append(avisoEstoque);
    }

    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "remover-item-carrinho";
    remover.textContent = "Remover";
    remover.dataset.removerItem = String(indice);

    detalhes.append(nome, preco, quantidade, remover);
    linha.append(imagem, detalhes);
    lista.append(linha);
  });

  document.querySelector("#total-carrinho").textContent = formatoMoeda.format(total);
  renderizarResumoPerfil();
}

function renderizarDadosCompra() {
  const camposCompra = document.querySelector("#campos-compra");
  if (!camposCompra) {
    return;
  }

  const aviso = document.querySelector("#aviso-conta-carrinho");
  try {
    const conteudoPerfil = localStorage.getItem(CHAVE_PERFIL);
    const perfil = conteudoPerfil ? JSON.parse(conteudoPerfil) : null;

    if (!perfil || typeof perfil.nome !== "string" || typeof perfil.email !== "string" || typeof perfil.telefone !== "string") {
      aviso.textContent = "Crie seu perfil para preencher os dados de contato antes da compra.";
      const link = document.createElement("a");
      link.href = "perfil.html";
      link.textContent = "Cadastrar perfil";
      aviso.append(" ", link);
      return;
    }

    document.querySelector("#compra-nome").value = perfil.nome;
    document.querySelector("#compra-email").value = perfil.email;
    document.querySelector("#compra-telefone").value = perfil.telefone;
    camposCompra.disabled = false;
    aviso.textContent = "Contato preenchido com os dados do seu perfil.";

    const conteudoEntrega = localStorage.getItem(CHAVE_ENTREGA);
    if (conteudoEntrega) {
      const entrega = JSON.parse(conteudoEntrega);
      for (const [nome, valor] of Object.entries(entrega)) {
        const campo = camposCompra.elements.namedItem(nome);
        if (campo && typeof valor === "string") {
          campo.value = valor;
        }
      }
    }
  } catch (erro) {
    aviso.textContent = `Não foi possível carregar seus dados de compra. ${erro.message}`;
  }
}

document.querySelector("#lista-produtos")?.addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-adicionar-carrinho]");
  if (!botao) {
    return;
  }

  try {
    const itens = lerCarrinho();
    const produtoId = botao.dataset.produtoId;
    const produto = window.GAVCatalogo
      ?.obterProdutos()
      .find((item) => item.id === produtoId);
    if (!produto || !produtoId || produto.estoque <= 0) {
      throw new Error("Este produto está sem estoque ou não está mais disponível.");
    }
    const { nome, imagem, preco, estoque } = produto;
    if (!nome || !imagem || !Number.isFinite(preco) || preco < 0) {
      throw new Error("Os dados deste produto estão inválidos.");
    }

    const existente = itens.find((item) => item.produtoId === produtoId || item.nome === nome);
    if (existente && existente.quantidade >= estoque) {
      throw new Error(`Estoque disponível: ${estoque} ${estoque === 1 ? "unidade" : "unidades"}.`);
    }
    if (existente) {
      existente.quantidade += 1;
      existente.produtoId = produtoId;
      existente.imagem = imagem;
      existente.preco = preco;
    } else {
      itens.push({ produtoId, nome, imagem, preco, quantidade: 1 });
    }

    salvarCarrinho(itens);
    window.location.assign("carrinho.html");
  } catch (erro) {
    mostrarErroCarrinho(`Não foi possível adicionar o produto. ${erro.message}`);
  }
});

document.querySelector("#lista-carrinho")?.addEventListener("change", (evento) => {
  const campo = evento.target.closest("[data-quantidade-item]");
  if (!campo) {
    return;
  }

  const quantidade = Number(campo.value);
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
    campo.value = "1";
    mostrarErroCarrinho("Informe uma quantidade entre 1 e 99.");
    return;
  }

  try {
    const itens = lerCarrinho();
    const indice = Number(campo.dataset.quantidadeItem);
    const item = itens[indice];
    const produtoAtual = window.GAVCatalogo?.obterProdutos().find((produto) =>
      item.produtoId ? produto.id === item.produtoId : produto.nome === item.nome
    );
    if (!produtoAtual) {
      campo.value = String(item.quantidade);
      mostrarErroCarrinho("Este produto não está mais disponível. Remova-o do carrinho.");
      return;
    }
    if (quantidade > produtoAtual.estoque) {
      campo.value = String(item.quantidade);
      mostrarErroCarrinho(
        `Estoque disponível de ${produtoAtual.nome}: ${produtoAtual.estoque} ${produtoAtual.estoque === 1 ? "unidade" : "unidades"}.`
      );
      return;
    }
    item.quantidade = quantidade;
    salvarCarrinho(itens);
    document.querySelector("#aviso-carrinho").textContent = "";
    renderizarCarrinho();
  } catch (erro) {
    mostrarErroCarrinho(`Não foi possível atualizar o carrinho. ${erro.message}`);
  }
});

document.querySelector("#lista-carrinho")?.addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-remover-item]");
  if (!botao) {
    return;
  }

  try {
    const itens = lerCarrinho();
    itens.splice(Number(botao.dataset.removerItem), 1);
    salvarCarrinho(itens);
    document.querySelector("#aviso-carrinho").textContent = "Produto removido do carrinho.";
    renderizarCarrinho();
  } catch (erro) {
    mostrarErroCarrinho(`Não foi possível remover o produto. ${erro.message}`);
  }
});

document.querySelector("#formulario-compra")?.addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (!evento.currentTarget.reportValidity()) {
    return;
  }

  try {
    const itens = lerCarrinho();
    if (itens.length === 0) {
      mostrarErroCarrinho("Adicione pelo menos um produto antes de revisar a compra.");
      return;
    }

    if (window.GAVCatalogo) {
      const produtos = window.GAVCatalogo.obterProdutos();
      const indisponivel = itens.find((item) => {
        const produto = produtos.find((atual) =>
          item.produtoId ? atual.id === item.produtoId : atual.nome === item.nome
        );
        return !produto || item.quantidade > produto.estoque;
      });
      if (indisponivel) {
        mostrarErroCarrinho(
          `${indisponivel.nome} não tem estoque suficiente. Ajuste ou remova este item antes de continuar.`
        );
        return;
      }
    }

    const campos = document.querySelector("#campos-compra");
    const entrega = Object.fromEntries(new FormData(document.querySelector("#formulario-compra")).entries());
    delete entrega.nome;
    delete entrega.email;
    delete entrega.telefone;
    localStorage.setItem(CHAVE_ENTREGA, JSON.stringify(entrega));
    document.querySelector("#aviso-carrinho").textContent =
      "Dados de entrega salvos neste navegador. O pedido não foi enviado e nenhum pagamento foi processado.";
  } catch (erro) {
    mostrarErroCarrinho(`Não foi possível salvar os dados da compra. ${erro.message}`);
  }
});

window.addEventListener("storage", (evento) => {
  if (window.GAVCatalogo && evento.key === window.GAVCatalogo.chave) {
    try {
      renderizarCarrinho();
    } catch (erro) {
      mostrarErroCarrinho(`Não foi possível atualizar o carrinho com o estoque atual. ${erro.message}`);
    }
  }
});

try {
  renderizarCarrinho();
  renderizarDadosCompra();
} catch (erro) {
  mostrarErroCarrinho(`Não foi possível carregar o carrinho. ${erro.message}`);
}
