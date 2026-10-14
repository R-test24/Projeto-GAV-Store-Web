const botaoTema = document.querySelector(".alternar-tema");
const chaveTema = "gav-store-tema";

function aplicarTema(tema) {
  const temaEscuro = tema === "escuro";
  document.body.dataset.tema = temaEscuro ? "escuro" : "claro";
  botaoTema.setAttribute("aria-pressed", String(temaEscuro));
  botaoTema.setAttribute("aria-label", temaEscuro ? "Ativar tema claro" : "Ativar tema escuro");
  botaoTema.innerHTML = temaEscuro
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="icone-lua" d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4z"></path></svg>';
}

aplicarTema(localStorage.getItem(chaveTema) || "claro");

botaoTema.addEventListener("click", () => {
  const tema = document.body.dataset.tema === "escuro" ? "claro" : "escuro";
  aplicarTema(tema);
  localStorage.setItem(chaveTema, tema);
});
