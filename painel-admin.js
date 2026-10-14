const formatoMoedaAdmin = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const chaveAcessosAdmin = "gavstore.acessos";
const chaveCarrinhoAdmin = "gavstore.carrinho";
const corpoTabelaProdutos = document.querySelector("#lista-produtos-admin");
const avisoPainel = document.querySelector("#aviso-painel");
const avisoCatalogo = document.querySelector("#aviso-catalogo");
const dialogoProduto = document.querySelector("#dialogo-editar-produto");
const formularioEdicao = document.querySelector("#formulario-editar-produto");

function mostrarAviso(elemento, mensagem, erro) {
  elemento.textContent = mensagem;
  if (erro) {
    console.error(mensagem, erro);
  }
}

function mensagemErroCatalogo(erro) {
  if (erro && (erro.name === "QuotaExceededError" || erro.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
    return "O armazenamento do navegador está cheio. Remova imagens antigas ou escolha menos fotos e tente novamente.";
  }
  return erro instanceof Error ? erro.message : "Ocorreu um erro inesperado.";
}

function lerCarrinhosEmAberto() {
  const conteudo = localStorage.getItem(chaveCarrinhoAdmin);
  if (conteudo === null) {
    return 0;
  }

  const itens = JSON.parse(conteudo);
  if (
    !Array.isArray(itens) ||
    itens.some(
      (item) =>
        !item ||
        typeof item.nome !== "string" ||
        !Number.isFinite(item.preco) ||
        !Number.isInteger(item.quantidade) ||
        item.quantidade < 1
    )
  ) {
    throw new Error("Os dados salvos do carrinho estão inválidos.");
  }

  return itens.length > 0 ? 1 : 0;
}

function atualizarIndicadores() {
  try {
    const acessosSalvos = localStorage.getItem(chaveAcessosAdmin);
    const acessos = acessosSalvos === null ? 0 : Number(acessosSalvos);
    if (!Number.isSafeInteger(acessos) || acessos < 0) {
      throw new Error("O contador de acessos salvo está inválido.");
    }

    const produtos = GAVCatalogo.obterProdutos();
    document.querySelector("#total-acessos").textContent = String(acessos);
    document.querySelector("#total-carrinhos").textContent = String(lerCarrinhosEmAberto());
    document.querySelector("#total-produtos").textContent = String(produtos.length);
    document.querySelector("#total-estoque").textContent = String(
      produtos.reduce((total, produto) => total + produto.estoque, 0)
    );
  } catch (erro) {
    mostrarAviso(avisoPainel, `Não foi possível carregar todos os indicadores. ${erro.message}`, erro);
  }
}

function criarLinhaProduto(produto) {
  const linha = document.createElement("tr");
  linha.dataset.produtoId = produto.id;
  linha.dataset.nomeProduto = produto.nome.toLocaleLowerCase("pt-BR");
  linha.dataset.estoqueProduto = String(produto.estoque);

  const celulaProduto = document.createElement("td");
  const produtoInfo = document.createElement("div");
  produtoInfo.className = "produto-tabela";
  const imagem = document.createElement("img");
  imagem.src = produto.imagem;
  imagem.alt = "";
  imagem.width = 48;
  imagem.height = 56;
  const nome = document.createElement("span");
  nome.textContent = produto.nome;
  produtoInfo.append(imagem, nome);
  celulaProduto.append(produtoInfo);

  const celulaPreco = document.createElement("td");
  celulaPreco.className = "preco-tabela";
  celulaPreco.textContent = formatoMoedaAdmin.format(produto.preco);

  const celulaEstoque = document.createElement("td");
  const statusEstoque = document.createElement("span");
  statusEstoque.className = "status-estoque";
  if (produto.estoque === 0) {
    statusEstoque.classList.add("estoque-zerado");
    statusEstoque.textContent = "Sem estoque";
  } else if (produto.estoque <= 5) {
    statusEstoque.classList.add("estoque-baixo");
    statusEstoque.textContent = `${produto.estoque} ${produto.estoque === 1 ? "unidade" : "unidades"} · Estoque baixo`;
  } else {
    statusEstoque.classList.add("estoque-disponivel");
    statusEstoque.textContent = `${produto.estoque} unidades`;
  }
  celulaEstoque.append(statusEstoque);

  const celulaAcoes = document.createElement("td");
  const acoes = document.createElement("div");
  acoes.className = "acoes-produto";
  const botaoEditar = document.createElement("button");
  botaoEditar.type = "button";
  botaoEditar.className = "botao-editar-produto";
  botaoEditar.dataset.editarProduto = "";
  botaoEditar.textContent = "Editar";
  botaoEditar.setAttribute("aria-label", `Editar ${produto.nome}`);
  const botaoExcluir = document.createElement("button");
  botaoExcluir.type = "button";
  botaoExcluir.className = "botao-excluir-produto";
  botaoExcluir.dataset.excluirProduto = "";
  botaoExcluir.textContent = "Excluir";
  botaoExcluir.setAttribute("aria-label", `Excluir ${produto.nome}`);
  acoes.append(botaoEditar, botaoExcluir);
  celulaAcoes.append(acoes);

  linha.append(celulaProduto, celulaPreco, celulaEstoque, celulaAcoes);
  return linha;
}

function filtrarTabelaProdutos() {
  const busca = document.querySelector("#buscar-produtos").value.trim().toLocaleLowerCase("pt-BR");
  const filtroEstoque = document.querySelector("#filtro-estoque").value;
  let produtosVisiveis = 0;

  for (const linha of corpoTabelaProdutos.querySelectorAll("[data-produto-id]")) {
    const estoque = Number(linha.dataset.estoqueProduto);
    const correspondeBusca = linha.dataset.nomeProduto.includes(busca);
    const correspondeEstoque =
      filtroEstoque === "todos" ||
      (filtroEstoque === "baixo" && estoque > 0 && estoque <= 5) ||
      (filtroEstoque === "zerado" && estoque === 0);
    linha.hidden = !correspondeBusca || !correspondeEstoque;
    if (!linha.hidden) {
      produtosVisiveis += 1;
    }
  }

  const vazio = corpoTabelaProdutos.querySelector("[data-estado-vazio]");
  if (vazio) {
    vazio.hidden = produtosVisiveis > 0;
  }
}

function renderizarTabelaProdutos() {
  try {
    const produtos = GAVCatalogo.obterProdutos();
    corpoTabelaProdutos.replaceChildren(...produtos.map(criarLinhaProduto));
    const linhaVazia = document.createElement("tr");
    linhaVazia.dataset.estadoVazio = "";
    const celulaVazia = document.createElement("td");
    celulaVazia.colSpan = 4;
    celulaVazia.className = "estado-vazio";
    celulaVazia.textContent = produtos.length === 0
      ? "Nenhum produto cadastrado. Use o formulário abaixo para adicionar o primeiro."
      : "Nenhum produto encontrado com esses filtros.";
    linhaVazia.append(celulaVazia);
    corpoTabelaProdutos.append(linhaVazia);

    document.querySelector("#contador-produtos").textContent =
      `${produtos.length} ${produtos.length === 1 ? "produto" : "produtos"}`;
    document.querySelector("#total-produtos").textContent = String(produtos.length);
    document.querySelector("#total-estoque").textContent = String(
      produtos.reduce((total, produto) => total + produto.estoque, 0)
    );
    filtrarTabelaProdutos();
  } catch (erro) {
    mostrarAviso(avisoCatalogo, `Não foi possível carregar o catálogo. ${erro.message}`, erro);
  }
}

function nomeImagemValido(caminho) {
  if (/^data:image\/(?:webp|png|jpeg);base64,/.test(caminho)) {
    return true;
  }
  if (caminho.startsWith("imagens/") && !caminho.split("/").includes("..")) {
    return true;
  }

  try {
    const url = new URL(caminho);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validarDadosProduto({ nome, preco, estoque, imagens }) {
  return (
    nome.length > 0 &&
    Number.isFinite(preco) &&
    preco > 0 &&
    Number.isSafeInteger(estoque) &&
    estoque >= 0 &&
    Array.isArray(imagens) &&
    imagens.length > 0 &&
    imagens.every((imagem) => imagem && nomeImagemValido(imagem.src))
  );
}

async function converterImagem(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error(`"${file.name}" não é um arquivo de imagem.`);
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error(`"${file.name}" excede o limite de 20 MB.`);
  }

  const bitmap = await createImageBitmap(file);
  try {
    const escala = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * escala));
    canvas.height = Math.max(1, Math.round(bitmap.height * escala));
    const contexto = canvas.getContext("2d");
    if (!contexto) {
      throw new Error("Não foi possível preparar esta imagem neste navegador.");
    }
    contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const imagem = canvas.toDataURL("image/webp", 0.82);
    if (imagem.length > 1_500_000) {
      throw new Error(`"${file.name}" ainda ficou muito grande após a compressão. Escolha uma imagem menor.`);
    }
    return imagem;
  } finally {
    bitmap.close();
  }
}

function aplicarAjusteImagem(linha) {
  const preview = linha.querySelector(".preview-imagem-produto");
  const zoom = Number(linha.querySelector('[data-ajuste-imagem="zoom"]').value);
  const x = Number(linha.querySelector('[data-ajuste-imagem="x"]').value);
  const y = Number(linha.querySelector('[data-ajuste-imagem="y"]').value);
  preview.style.objectPosition = `${x}% ${y}%`;
  preview.style.transform = `scale(${zoom / 100})`;
  linha.querySelector('[data-valor-ajuste="zoom"]').textContent = `${zoom}%`;
  linha.querySelector('[data-valor-ajuste="x"]').textContent = `${x}%`;
  linha.querySelector('[data-valor-ajuste="y"]').textContent = `${y}%`;
}

function criarControleAjuste(titulo, tipo, valor, minimo, maximo) {
  const controle = document.createElement("label");
  controle.className = "controle-ajuste-imagem";
  const cabecalho = document.createElement("span");
  cabecalho.className = "rotulo-controle-ajuste";
  const nome = document.createElement("span");
  nome.textContent = titulo;
  const valorAtual = document.createElement("output");
  valorAtual.dataset.valorAjuste = tipo;
  valorAtual.textContent = `${valor}%`;
  cabecalho.append(nome, valorAtual);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = String(minimo);
  slider.max = String(maximo);
  slider.value = String(valor);
  slider.dataset.ajusteImagem = tipo;
  slider.setAttribute("aria-label", `${titulo} da imagem`);
  controle.append(cabecalho, slider);
  return controle;
}

function criarCampoImagem(imagem, indice) {
  const campo = document.createElement("div");
  campo.className = "campo-imagem-produto";
  campo.dataset.imagem = JSON.stringify(imagem);

  const quadroPreview = document.createElement("div");
  quadroPreview.className = "quadro-preview-imagem";
  const preview = document.createElement("img");
  preview.className = "preview-imagem-produto";
  if (imagem.src) {
    preview.src = imagem.src;
  }
  preview.style.objectPosition = `${imagem.x}% ${imagem.y}%`;
  preview.style.transform = `scale(${imagem.zoom / 100})`;
  preview.alt = "";
  quadroPreview.append(preview);

  const conteudo = document.createElement("div");
  conteudo.className = "conteudo-imagem-produto";

  const seletor = document.createElement("label");
  seletor.className = "seletor-arquivo-imagem";
  const legenda = document.createElement("span");
  legenda.textContent =
    imagem.nomeArquivo ||
    (imagem.src.startsWith("data:image/") ? "Imagem carregada" : imagem.src ? "Imagem atual" : "Escolha um arquivo");
  const entrada = document.createElement("input");
  entrada.type = "file";
  entrada.accept = "image/*";
  entrada.dataset.arquivoImagem = "";
  entrada.setAttribute("aria-label", `Escolher arquivo para a imagem ${indice + 1}`);
  seletor.append(legenda, entrada);

  const ajustes = document.createElement("div");
  ajustes.className = "ajustes-imagem";
  ajustes.append(
    criarControleAjuste("Zoom", "zoom", imagem.zoom, 100, 250),
    criarControleAjuste("Horizontal", "x", imagem.x, 0, 100),
    criarControleAjuste("Vertical", "y", imagem.y, 0, 100)
  );

  const remover = document.createElement("button");
  remover.type = "button";
  remover.className = "botao-remover-imagem";
  remover.dataset.removerImagem = "";
  remover.textContent = "Remover foto";
  remover.setAttribute("aria-label", `Remover imagem ${indice + 1}`);
  conteudo.append(seletor, ajustes);
  campo.append(quadroPreview, conteudo, remover);
  return campo;
}

function renderizarCamposImagem(imagens) {
  const lista = document.querySelector("#lista-imagens-produto");
  lista.replaceChildren(...imagens.map((imagem, indice) => criarCampoImagem(imagem, indice)));
  lista.querySelectorAll("[data-remover-imagem]").forEach((botao) => {
    botao.disabled = imagens.length === 1;
  });
}

function lerImagensDoEditor() {
  return [...document.querySelectorAll("#lista-imagens-produto .campo-imagem-produto")]
    .map((campo) => {
      const imagem = JSON.parse(campo.dataset.imagem);
      return {
        ...imagem,
        zoom: Number(campo.querySelector('[data-ajuste-imagem="zoom"]').value),
        x: Number(campo.querySelector('[data-ajuste-imagem="x"]').value),
        y: Number(campo.querySelector('[data-ajuste-imagem="y"]').value),
      };
    })
    .filter((imagem) => imagem.src);
}

function abrirEdicaoProduto(id) {
  try {
    const produto = GAVCatalogo.obterProdutos().find((item) => item.id === id);
    if (!produto) {
      throw new Error("Este produto não está mais no catálogo. Atualize a página e tente novamente.");
    }

    formularioEdicao.elements.id.value = produto.id;
    formularioEdicao.elements.nome.value = produto.nome;
    formularioEdicao.elements.preco.value = produto.preco.toFixed(2);
    formularioEdicao.elements.estoque.value = String(produto.estoque);
    renderizarCamposImagem(produto.imagens);
    mostrarAviso(document.querySelector("#aviso-edicao-produto"), "");
    dialogoProduto.showModal();
  } catch (erro) {
    mostrarAviso(avisoCatalogo, `Não foi possível abrir o produto para edição. ${erro.message}`, erro);
  }
}

corpoTabelaProdutos.addEventListener("click", (evento) => {
  const botaoEditar = evento.target.closest("[data-editar-produto]");
  const botaoExcluir = evento.target.closest("[data-excluir-produto]");
  if (!botaoEditar && !botaoExcluir) {
    return;
  }

  const linha = evento.target.closest("[data-produto-id]");
  if (!linha) {
    return;
  }

  if (botaoEditar) {
    abrirEdicaoProduto(linha.dataset.produtoId);
    return;
  }

  try {
    const produtos = GAVCatalogo.obterProdutos();
    const indice = produtos.findIndex((produto) => produto.id === linha.dataset.produtoId);
    if (indice === -1) {
      throw new Error("Este produto não está mais no catálogo. Atualize a página e tente novamente.");
    }

    if (window.confirm(`Excluir "${produtos[indice].nome}" do catálogo?`)) {
      const [removido] = produtos.splice(indice, 1);
      GAVCatalogo.salvarProdutos(produtos);
      renderizarTabelaProdutos();
      atualizarIndicadores();
      mostrarAviso(avisoCatalogo, `${removido.nome} foi removido do catálogo.`);
    }
  } catch (erro) {
    mostrarAviso(avisoCatalogo, `Não foi possível excluir o produto. ${erro.message}`, erro);
  }
});

formularioEdicao.addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (!formularioEdicao.reportValidity()) {
    return;
  }

  const formulario = formularioEdicao;
  const imagens = lerImagensDoEditor();
  const produtoAtualizado = {
    id: formulario.elements.id.value,
    nome: formulario.elements.nome.value.trim(),
    preco: Number(formulario.elements.preco.value),
    estoque: Number(formulario.elements.estoque.value),
    imagem: imagens[0]?.src,
    imagens,
  };
  const avisoEdicao = document.querySelector("#aviso-edicao-produto");

  if (!validarDadosProduto(produtoAtualizado)) {
    mostrarAviso(avisoEdicao, "Confira o nome, o preço, o estoque e se cada imagem foi carregada corretamente.");
    return;
  }

  try {
    const produtos = GAVCatalogo.obterProdutos();
    const indice = produtos.findIndex((produto) => produto.id === produtoAtualizado.id);
    if (indice === -1) {
      throw new Error("Este produto não está mais no catálogo. Atualize a página e tente novamente.");
    }
    if (
      produtos.some(
        (produto) =>
          produto.id !== produtoAtualizado.id &&
          produto.nome.toLocaleLowerCase("pt-BR") === produtoAtualizado.nome.toLocaleLowerCase("pt-BR")
      )
    ) {
      mostrarAviso(avisoEdicao, "Já existe outro produto com esse nome no catálogo.");
      return;
    }
    produtos[indice] = { ...produtos[indice], ...produtoAtualizado };
    GAVCatalogo.salvarProdutos(produtos);
    dialogoProduto.close();
    renderizarTabelaProdutos();
    atualizarIndicadores();
    mostrarAviso(avisoCatalogo, `${produtoAtualizado.nome} foi atualizado.`);
  } catch (erro) {
    mostrarAviso(avisoEdicao, `Não foi possível salvar as alterações. ${mensagemErroCatalogo(erro)}`, erro);
  }
});

document.querySelectorAll("[data-fechar-dialogo]").forEach((botao) => {
  botao.addEventListener("click", () => dialogoProduto.close());
});

document.querySelector("#adicionar-imagem-produto").addEventListener("click", () => {
  const lista = document.querySelector("#lista-imagens-produto");
  const imagens = lerImagensDoEditor();
  lista.append(criarCampoImagem({ src: "", zoom: 100, x: 50, y: 50 }, imagens.length));
  lista.querySelectorAll("[data-remover-imagem]").forEach((botao) => {
    botao.disabled = false;
  });
  lista.lastElementChild.querySelector("[data-arquivo-imagem]").click();
});

document.querySelector("#lista-imagens-produto").addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-remover-imagem]");
  if (!botao || botao.disabled) {
    return;
  }

  botao.closest(".campo-imagem-produto").remove();
  document.querySelectorAll("#lista-imagens-produto .campo-imagem-produto").forEach((campo, indice) => {
    campo.querySelector("[data-arquivo-imagem]").setAttribute("aria-label", `Escolher arquivo para a imagem ${indice + 1}`);
    campo.querySelector("button").setAttribute("aria-label", `Remover imagem ${indice + 1}`);
  });
  const imagensRestantes = document.querySelectorAll("#lista-imagens-produto .campo-imagem-produto").length;
  if (imagensRestantes === 1) {
    document.querySelector("#lista-imagens-produto [data-remover-imagem]").disabled = true;
  }
});

document.querySelector("#lista-imagens-produto").addEventListener("input", (evento) => {
  const slider = evento.target.closest("[data-ajuste-imagem]");
  if (slider) {
    aplicarAjusteImagem(slider.closest(".campo-imagem-produto"));
  }
});

document.querySelector("#lista-imagens-produto").addEventListener("change", async (evento) => {
  const entrada = evento.target.closest("[data-arquivo-imagem]");
  const arquivo = entrada?.files[0];
  if (!entrada || !arquivo) {
    return;
  }

  const campo = entrada.closest(".campo-imagem-produto");
  const avisoEdicao = document.querySelector("#aviso-edicao-produto");
  try {
    const src = await converterImagem(arquivo);
    const imagem = JSON.parse(campo.dataset.imagem);
    imagem.src = src;
    imagem.nomeArquivo = arquivo.name;
    campo.dataset.imagem = JSON.stringify(imagem);
    campo.querySelector(".preview-imagem-produto").src = src;
    campo.querySelector(".seletor-arquivo-imagem > span").textContent = arquivo.name;
    mostrarAviso(avisoEdicao, "Imagem carregada. Ajuste o enquadramento e salve o produto.");
  } catch (erro) {
    mostrarAviso(avisoEdicao, `Não foi possível carregar esta imagem. ${erro.message}`, erro);
    entrada.value = "";
  }
});

document.querySelector("#formulario-produto").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  if (!formulario.reportValidity()) {
    return;
  }

  const nome = formulario.elements.nome.value.trim();
  const preco = Number(formulario.elements.preco.value);
  const estoque = Number(formulario.elements.estoque.value);
  const arquivos = [...formulario.elements.imagens.files];
  if (!nome || !Number.isFinite(preco) || preco <= 0 || !Number.isSafeInteger(estoque) || estoque < 0 || arquivos.length === 0) {
    mostrarAviso(avisoCatalogo, "Informe nome, preço, estoque e escolha pelo menos uma imagem.");
    return;
  }

  try {
    const imagens = await Promise.all(
      arquivos.map(async (arquivo) => ({
        src: await converterImagem(arquivo),
        nomeArquivo: arquivo.name,
        zoom: 100,
        x: 50,
        y: 50,
      }))
    );
    const produtos = GAVCatalogo.obterProdutos();
    if (produtos.some((produto) => produto.nome.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"))) {
      mostrarAviso(avisoCatalogo, "Já existe um produto com esse nome no catálogo.");
      return;
    }

    const id = `produto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    produtos.push({
      id,
      nome,
      preco: Math.round(preco * 100) / 100,
      estoque,
      imagem: imagens[0].src,
      imagens,
    });
    GAVCatalogo.salvarProdutos(produtos);
    formulario.reset();
    formulario.elements.estoque.value = "0";
    renderizarTabelaProdutos();
    atualizarIndicadores();
    mostrarAviso(avisoCatalogo, `${nome} foi cadastrado no catálogo.`);
  } catch (erro) {
    mostrarAviso(avisoCatalogo, `Não foi possível cadastrar o produto. ${mensagemErroCatalogo(erro)}`, erro);
  }
});

document.querySelector("#buscar-produtos").addEventListener("input", filtrarTabelaProdutos);
document.querySelector("#filtro-estoque").addEventListener("change", filtrarTabelaProdutos);

window.addEventListener("storage", (evento) => {
  if (evento.key === chaveAcessosAdmin || evento.key === chaveCarrinhoAdmin || evento.key === GAVCatalogo.chave) {
    atualizarIndicadores();
    renderizarTabelaProdutos();
  }
});

atualizarIndicadores();
renderizarTabelaProdutos();
