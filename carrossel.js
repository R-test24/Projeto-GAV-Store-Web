const carrossel = document.querySelector(".carrossel");

if (carrossel) {
  const slides = Array.from(carrossel.querySelectorAll(".carrossel-slide"));
  const indicadores = Array.from(carrossel.querySelectorAll(".carrossel-indicadores button"));
  const botaoAnterior = carrossel.querySelector(".carrossel-seta.anterior");
  const botaoProximo = carrossel.querySelector(".carrossel-seta.proximo");
  const botaoPausa = carrossel.querySelector(".carrossel-pausa");
  const prefereMovimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
  let indiceAtual = 0;
  let rotacaoPausada = prefereMovimentoReduzido.matches;
  let ponteiroSobreCarrossel = false;
  let focoNoCarrossel = false;
  let temporizador;

  function mostrarSlide(indice, anunciar = false) {
    indiceAtual = (indice + slides.length) % slides.length;

    slides.forEach((slide, posicao) => {
      const ativo = posicao === indiceAtual;
      slide.classList.toggle("ativo", ativo);
      slide.setAttribute("aria-hidden", String(!ativo));
      slide.inert = !ativo;
      indicadores[posicao].classList.toggle("ativo", ativo);

      if (ativo) {
        indicadores[posicao].setAttribute("aria-current", "true");
      } else {
        indicadores[posicao].removeAttribute("aria-current");
      }
    });

    if (anunciar) {
      carrossel.querySelector("#aviso-carrossel").textContent =
        `Destaque ${indiceAtual + 1} de ${slides.length}.`;
    }
  }

  function pausarParaInteracao() {
    rotacaoPausada = true;
    atualizarBotaoPausa();
  }

  function pararRotacao() {
    window.clearInterval(temporizador);
  }

  function iniciarRotacao() {
    pararRotacao();

    if (
      rotacaoPausada
      || ponteiroSobreCarrossel
      || focoNoCarrossel
      || document.hidden
      || slides.length < 2
    ) {
      return;
    }

    temporizador = window.setInterval(() => mostrarSlide(indiceAtual + 1), 5000);
  }

  function atualizarBotaoPausa() {
    const pausado = rotacaoPausada;
    botaoPausa.setAttribute("aria-pressed", String(pausado));
    botaoPausa.setAttribute("aria-label", pausado ? "Iniciar carrossel" : "Pausar carrossel");
    botaoPausa.firstElementChild.textContent = pausado ? "\u25b6" : "\u275a\u275a";
  }

  botaoAnterior.addEventListener("click", () => {
    pausarParaInteracao();
    mostrarSlide(indiceAtual - 1, true);
    iniciarRotacao();
  });

  botaoProximo.addEventListener("click", () => {
    pausarParaInteracao();
    mostrarSlide(indiceAtual + 1, true);
    iniciarRotacao();
  });

  indicadores.forEach((indicador, indice) => {
    indicador.addEventListener("click", () => {
      pausarParaInteracao();
      mostrarSlide(indice, true);
      iniciarRotacao();
    });
  });

  botaoPausa.addEventListener("click", () => {
    rotacaoPausada = !rotacaoPausada;
    atualizarBotaoPausa();
    iniciarRotacao();
  });

  carrossel.addEventListener("mouseenter", () => {
    ponteiroSobreCarrossel = true;
    pararRotacao();
  });

  carrossel.addEventListener("mouseleave", () => {
    ponteiroSobreCarrossel = false;
    iniciarRotacao();
  });

  carrossel.addEventListener("focusin", () => {
    focoNoCarrossel = true;
    pararRotacao();
  });

  carrossel.addEventListener("focusout", (evento) => {
    if (!carrossel.contains(evento.relatedTarget)) {
      focoNoCarrossel = false;
      iniciarRotacao();
    }
  });

  document.addEventListener("visibilitychange", iniciarRotacao);

  prefereMovimentoReduzido.addEventListener("change", (evento) => {
    if (evento.matches) {
      rotacaoPausada = true;
    }
    atualizarBotaoPausa();
    iniciarRotacao();
  });

  atualizarBotaoPausa();
  iniciarRotacao();
}
