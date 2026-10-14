(function () {
  const CHAVE = "gavstore.personalizacao";
  const padrao = {
    imagens: {
      slide1: "imagens/banner.png",
      slide2: "imagens/figma/atleta-estudio.png",
      slide3: "imagens/figma/treino-dupla-por-do-sol.png",
      bannerCentro: "imagens/bannercentro.png",
      categoria1: "imagens/figma/conjunto-preto.png",
      categoria2: "imagens/figma/ajuste-conjunto-azul.png",
      categoria3: "imagens/figma/conjunto-coral-shorts.png",
      categoria4: "imagens/figma/atleta-jaqueta-urbana.png",
      galeria1: "imagens/figma/treino-dupla-por-do-sol-preview.png",
      galeria2: "imagens/figma/atleta-estudio-preview.png",
      galeria3: "imagens/figma/corrida-urbana-preview.png",
      guia: "imagens/figma/ajuste-conjunto-azul.png",
    },
    tituloSlide: "Seu movimento, suas regras.",
    descricaoSlide: "Encontre peças que acompanham cada treino.",
    botaoSlide1: "Ver coleção",
    botaoSlide3: "Explore os produtos",
    descricaoRodape: "Performance e estilo para acompanhar seu movimento.",
    copyright: "Todos os direitos reservados.",
    redes: {
      instagram: "https://www.instagram.com/",
      facebook: "https://www.facebook.com/",
      whatsapp: "https://www.whatsapp.com/",
    },
    secoes: {
      colecao: true,
      movimento: true,
      bannerCentro: true,
      video: true,
      manifesto: true,
      produtos: true,
      guia: true,
      beneficiosRodape: true,
      menuSobre: true,
      menuContatos: true,
    },
  };

  function ler() {
    const dados = localStorage.getItem(CHAVE);
    if (dados === null) {
      return structuredClone(padrao);
    }

    const config = JSON.parse(dados);
    if (
      !config ||
      typeof config !== "object" ||
      !config.imagens ||
      typeof config.imagens !== "object" ||
      (config.redes !== undefined && typeof config.redes !== "object") ||
      !config.secoes ||
      typeof config.secoes !== "object"
    ) {
      throw new Error("As personalizações salvas para a página inicial estão inválidas.");
    }

    return {
      ...structuredClone(padrao),
      ...config,
      imagens: { ...padrao.imagens, ...config.imagens },
      redes: { ...padrao.redes, ...config.redes },
      secoes: { ...padrao.secoes, ...config.secoes },
    };
  }

  function salvar(config) {
    if (!config || typeof config !== "object" || !config.imagens || !config.secoes) {
      throw new Error("Não foi possível salvar as personalizações: dados inválidos.");
    }
    localStorage.setItem(CHAVE, JSON.stringify(config));
  }

  function restaurar() {
    localStorage.removeItem(CHAVE);
  }

  window.GAVSiteConfig = Object.freeze({ chave: CHAVE, ler, salvar, restaurar });

  function aplicar() {
    try {
      const config = ler();
      const carrossel = document.querySelector(".carrossel");
      if (carrossel) {
        const titulo = carrossel.querySelector(".carrossel-legenda h1");
        if (titulo) {
          titulo.textContent = config.tituloSlide;
        }
      }

      document.querySelectorAll("[data-texto-site]").forEach((elemento) => {
        const chave = elemento.dataset.textoSite;
        if (typeof config[chave] === "string") {
          const seta = elemento.querySelector("[aria-hidden='true']");
          if (seta) {
            elemento.firstChild.textContent = `${config[chave]} `;
          } else {
            elemento.textContent = config[chave];
          }
        }
      });

      document.querySelectorAll("[data-imagem-site]").forEach((imagem) => {
        const personalizada = config.imagens[imagem.dataset.imagemSite];
        if (personalizada) {
          imagem.src = personalizada;
        }
      });

      const descricaoRodape = document.querySelector(".rodape-marca > p");
      if (descricaoRodape) {
        descricaoRodape.textContent = config.descricaoRodape;
      }
      const copyright = document.querySelector(".rodape-final > p");
      if (copyright) {
        copyright.textContent = `© ${new Date().getFullYear()} GAV Store. ${config.copyright}`;
      }
      document.querySelectorAll("[data-rede-social]").forEach((link) => {
        const endereco = config.redes[link.dataset.redeSocial];
        if (typeof endereco === "string" && /^https?:\/\//i.test(endereco)) {
          link.href = endereco;
        }
      });

      document.querySelectorAll("[data-area-site]").forEach((elemento) => {
        const chave = elemento.dataset.areaSite;
        elemento.hidden = config.secoes[chave] === false;
      });
      document.querySelectorAll("[data-menu-site]").forEach((link) => {
        link.hidden = config.secoes[link.dataset.menuSite] === false;
      });
    } catch (erro) {
      console.error("Não foi possível aplicar as personalizações da página inicial.", erro);
    }
  }

  aplicar();
  window.addEventListener("storage", (evento) => {
    if (evento.key === CHAVE || evento.key === null) {
      aplicar();
    }
  });
})();
