const formularioPersonalizacao = document.querySelector("#formulario-personalizacao");
const avisoPersonalizacao = document.querySelector("#aviso-personalizacao");
const camposImagemSite = [...document.querySelectorAll("[data-imagem-site]")];
const camposTextoAlternativoSite = [...document.querySelectorAll("[data-texto-alternativo-site]")];
const controlesAjusteBanner = [...document.querySelectorAll("[data-ajuste-banner]")];
const imagensPendentesSite = new Map();
const ajustesPendentesBanner = new Map();
const idsPreviewImagemSite = {
  slide1: "preview-slide-1",
  slide2: "preview-slide-2",
  slide3: "preview-slide-3",
};

function obterPreviewImagem(chave) {
  const id = idsPreviewImagemSite[chave]
    || `preview-${chave.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`)}`;
  return document.getElementById(id);
}

function obterValoresAjusteBanner(campo) {
  return {
    zoom: Number(campo.querySelector("[data-controle-ajuste='zoom']").value),
    x: Number(campo.querySelector("[data-controle-ajuste='x']").value),
    y: Number(campo.querySelector("[data-controle-ajuste='y']").value),
  };
}

function atualizarAjusteBanner(campo) {
  const ajuste = obterValoresAjusteBanner(campo);
  campo.querySelectorAll("[data-controle-ajuste]").forEach((controle) => {
    const saida = campo.querySelector(`[data-valor-ajuste="${controle.dataset.controleAjuste}"]`);
    saida.value = `${controle.value}%`;
    saida.textContent = `${controle.value}%`;
  });

  const preview = obterPreviewImagem(campo.dataset.ajusteBanner);
  if (!preview) {
    throw new Error("Não foi possível encontrar a prévia do banner para ajustar.");
  }
  preview.style.objectPosition = `${ajuste.x}% ${ajuste.y}%`;
  preview.style.transform = `scale(${ajuste.zoom / 100})`;
  preview.style.transformOrigin = "center";
}

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
    return {
      src: imagem,
      larguraOriginal: bitmap.width,
      alturaOriginal: bitmap.height,
      larguraFinal: canvas.width,
      alturaFinal: canvas.height,
      tamanhoOriginal: arquivo.size,
      tamanhoFinal: Math.ceil(imagem.length * 3 / 4),
    };
  } finally {
    bitmap.close();
  }
}

function formatarTamanhoArquivo(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
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
    controlesAjusteBanner.forEach((campo) => {
      const chave = campo.dataset.ajusteBanner;
      const ajuste = config.ajustesImagens[chave] || {
        zoom: 100,
        x: 50,
        y: chave === "slide3" ? 38 : 50,
      };
      campo.querySelectorAll("[data-controle-ajuste]").forEach((controle) => {
        controle.value = String(ajuste[controle.dataset.controleAjuste]);
      });
      atualizarAjusteBanner(campo);
    });

    camposImagemSite.forEach((campo) => {
      const imagem = config.imagens[campo.dataset.imagemSite];
      const preview = obterPreviewImagem(campo.dataset.imagemSite);
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
      imagensPendentesSite.set(campo.dataset.imagemSite, imagem.src);
      const preview = obterPreviewImagem(campo.dataset.imagemSite);
      if (!preview) {
        throw new Error("Não foi possível encontrar a prévia da imagem selecionada.");
      }
      preview.src = imagem.src;
      const informacao = document.querySelector(`[data-info-imagem="${campo.dataset.imagemSite}"]`);
      if (informacao) {
        informacao.textContent = `Original: ${imagem.larguraOriginal} × ${imagem.alturaOriginal} px, ${formatarTamanhoArquivo(imagem.tamanhoOriginal)}. Otimizada: ${imagem.larguraFinal} × ${imagem.alturaFinal} px, cerca de ${formatarTamanhoArquivo(imagem.tamanhoFinal)}.`;
      }
      informarPersonalizacao(`${arquivo.name} carregada e otimizada. Salve para aplicar na loja.`);
    } catch (erro) {
      campo.value = "";
      informarPersonalizacao(`Não foi possível carregar a imagem. ${mensagemErroPersonalizacao(erro)}`, erro);
    }
  });
});

controlesAjusteBanner.forEach((campo) => {
  campo.addEventListener("input", (evento) => {
    if (!evento.target.matches("[data-controle-ajuste]")) {
      return;
    }
    try {
      const chave = campo.dataset.ajusteBanner;
      const ajuste = obterValoresAjusteBanner(campo);
      ajustesPendentesBanner.set(chave, ajuste);
      atualizarAjusteBanner(campo);
    } catch (erro) {
      informarPersonalizacao(`Não foi possível atualizar a prévia do banner. ${mensagemErroPersonalizacao(erro)}`, erro);
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
    config.ajustesImagens = { ...config.ajustesImagens };
    ajustesPendentesBanner.forEach((ajuste, chave) => {
      config.ajustesImagens[chave] = ajuste;
    });
    GAVSiteConfig.salvar(config);
    imagensPendentesSite.clear();
    ajustesPendentesBanner.clear();
    informarPersonalizacao("Personalização salva. Recarregue a página inicial para conferir as alterações.");
  } catch (erro) {
    informarPersonalizacao(`Não foi possível salvar. ${mensagemErroPersonalizacao(erro)}`, erro);
  }
});

document.querySelector("#restaurar-personalizacao").addEventListener("click", () => {
  try {
    GAVSiteConfig.restaurar();
    imagensPendentesSite.clear();
    ajustesPendentesBanner.clear();
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
