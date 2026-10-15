const formularioPesquisa = document.querySelector("#formulario-pesquisa");
const campoPesquisa = document.querySelector("#termo-pesquisa");
const listaResultadosPesquisa = document.querySelector("#lista-produtos");
const estadoPesquisa = document.querySelector("#estado-pesquisa");
const avisoSemResultados = document.querySelector("#sem-resultados");

function filtrarProdutos() {
  const termo = campoPesquisa.value.trim().toLocaleLowerCase("pt-BR");
  let quantidadeVisivel = 0;

  for (const cartao of listaResultadosPesquisa.querySelectorAll(".card")) {
    const nome = cartao.querySelector("h3").textContent.toLocaleLowerCase("pt-BR");
    cartao.hidden = !nome.includes(termo);
    if (!cartao.hidden) {
      quantidadeVisivel += 1;
    }
  }

  estadoPesquisa.textContent = `${quantidadeVisivel} ${quantidadeVisivel === 1 ? "produto encontrado" : "produtos encontrados"}.`;
  avisoSemResultados.hidden = quantidadeVisivel > 0;
}

campoPesquisa.addEventListener("input", filtrarProdutos);
formularioPesquisa.addEventListener("submit", (evento) => {
  evento.preventDefault();
  filtrarProdutos();
});

filtrarProdutos();
