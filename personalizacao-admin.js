const formularioPersonalizacao = document.querySelector("#formulario-personalizacao");
const avisoPersonalizacao = document.querySelector("#aviso-personalizacao");
const camposImagemSite = [...document.querySelectorAll("[data-imagem-site]")];
const camposTextoAlternativoSite = [...document.querySelectorAll("[data-texto-alternativo-site]")];
const imagensPendentesSite = new Map();

function informarPersonalizacao(mensagem, erro) {
  avisoPersonalizacao.textContent = mensagem;
  if (erro) {
    console.error(mensagem, erro);
  }
}

function mensagemErroPersonalizacao(erro) {
  if (erro && (erro.name === "QuotaExceededError" || erro.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
    return "O armazenamento do navegador está cheio. Escolha menos imagens ou imagens menores e tente novamente.";
  }
  return erro instanceof Error ? erro.message : "Ocorreu um erro inesperado.";
}

async function comprimirImagemSite(arquivo) {
  if (!arquivo.type.startsWith("image/")) {
    throw new Error(`"${arquivo.name}" não é um arquivo de imagem.`);
  }
  if (arquivo.size > 20 * 1024 * 1024) {
    throw new Error(`"${arquivo.name}" excede o limite de 20 MB.`);
  }

  const bitmap = await createImageBitmap(arquivo);
  try {
    const escala = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * escala));
    canvas.height = Math.max(1, Math.round(bitmap.height * escala));
    const contexto = canvas.getContext("2d");
    if (!contexto) {
      throw new Error("Não foi possível preparar a imagem neste navegador.");
    }
    contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const imagem = canvas.toDataURL("image/webp", 0.72);
    if (imagem.length > 800_000) {
      throw new Error(`"${arquivo.name}" continua muito grande após a compressão.`);
    }
    return imagem;
  } finally {
    bitmap.close();
  }
}

function carregarFormularioPersonalizacao() {
  try {
    const config = GAVSiteConfig.ler();
    document.querySelector("#texto-slide-3").value = config.tituloSlide;
    document.querySelector("#descricao-slide-3").value = config.descricaoSlide;
    document.querySelector("#botao-slide-1").value = config.botaoSlide1;
    document.querySelector("#botao-slide-3").value = config.botaoSlide3;
    document.querySelector("#descricao-rodape").value = config.descricaoRodape;
    document.querySelector("#texto-copyright").value = config.copyright;
    document.querySelector("#link-instagram").value = config.redes.instagram;
    document.querySelector("#link-facebook").value = config.redes.facebook;
    document.querySelector("#link-whatsapp").value = config.redes.whatsapp;
    document.querySelectorAll("[data-secao-site]").forEach((campo) => {
      campo.checked = config.secoes[campo.dataset.secaoSite] !== false;
    });
    camposTextoAlternativoSite.forEach((campo) => {
      campo.value = config.textosAlternativos[campo.dataset.textoAlternativoSite] || "";
    });

    camposImagemSite.forEach((campo) => {
      const imagem = config.imagens[campo.dataset.imagemSite];
      const preview = document.querySelector(`#preview-${campo.dataset.imagemSite.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`)}`);
      if (imagem && preview) {
        preview.src = imagem;
      }
    });
  } catch (erro) {
    informarPersonalizacao(`Não foi possível carregar as personalizações. ${mensagemErroPersonalizacao(erro)}`, erro);
  }
}

camposImagemSite.forEach((campo) => {
  campo.addEventListener("change", async () => {
    const arquivo = campo.files[0];
    if (!arquivo) {
      imagensPendentesSite.delete(campo.dataset.imagemSite);
      return;
    }

    try {
      const imagem = await comprimirImagemSite(arquivo);
      imagensPendentesSite.set(campo.dataset.imagemSite, imagem);
      const previewId = `preview-${campo.dataset.imagemSite.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`)}`;
      document.querySelector(`#${previewId}`).src = imagem;
      informarPersonalizacao(`${arquivo.name} carregada. Salve para aplicar na loja.`);
    } catch (erro) {
      campo.value = "";
      informarPersonalizacao(`Não foi possível carregar a imagem. ${mensagemErroPersonalizacao(erro)}`, erro);
    }
  });
});

formularioPersonalizacao.addEventListener("submit", (evento) => {
  evento.preventDefault();
  try {
    const config = GAVSiteConfig.ler();
    config.tituloSlide = document.querySelector("#texto-slide-3").value.trim();
    config.descricaoSlide = document.querySelector("#descricao-slide-3").value.trim();
    config.botaoSlide1 = document.querySelector("#botao-slide-1").value.trim();
    config.botaoSlide3 = document.querySelector("#botao-slide-3").value.trim();
    config.descricaoRodape = document.querySelector("#descricao-rodape").value.trim();
    config.copyright = document.querySelector("#texto-copyright").value.trim();
    config.redes = {
      instagram: document.querySelector("#link-instagram").value.trim(),
      facebook: document.querySelector("#link-facebook").value.trim(),
      whatsapp: document.querySelector("#link-whatsapp").value.trim(),
    };
    config.textosAlternativos = Object.fromEntries(
      camposTextoAlternativoSite.map((campo) => [
        campo.dataset.textoAlternativoSite,
        campo.value.trim(),
      ])
    );
    for (const endereco of Object.values(config.redes)) {
      if (!/^https?:\/\/\S+$/i.test(endereco)) {
        throw new Error("Informe links completos que comecem com https:// ou http:// para as redes sociais.");
      }
    }
    config.secoes = Object.fromEntries(
      [...document.querySelectorAll("[data-secao-site]")].map((campo) => [
        campo.dataset.secaoSite,
        campo.checked,
      ])
    );
    imagensPendentesSite.forEach((imagem, chave) => {
      config.imagens[chave] = imagem;
    });
    GAVSiteConfig.salvar(config);
    imagensPendentesSite.clear();
    informarPersonalizacao("Personalização salva. Recarregue a página inicial para conferir as alterações.");
  } catch (erro) {
    informarPersonalizacao(`Não foi possível salvar. ${mensagemErroPersonalizacao(erro)}`, erro);
  }
});

document.querySelector("#restaurar-personalizacao").addEventListener("click", () => {
  try {
    GAVSiteConfig.restaurar();
    imagensPendentesSite.clear();
    formularioPersonalizacao.reset();
    camposImagemSite.forEach((campo) => {
      campo.value = "";
    });
    carregarFormularioPersonalizacao();
    informarPersonalizacao("Personalizações restauradas ao padrão. Recarregue a página inicial para conferir.");
  } catch (erro) {
    informarPersonalizacao(`Não foi possível restaurar o padrão. ${mensagemErroPersonalizacao(erro)}`, erro);
  }
});

carregarFormularioPersonalizacao();
