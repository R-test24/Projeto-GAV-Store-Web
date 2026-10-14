const formularioCadastro = document.querySelector("#formulario-cadastro");
const campoSenha = document.querySelector("#senha");
const campoConfirmarSenha = document.querySelector("#confirmar-senha");
const avisoCadastro = document.querySelector("#aviso-cadastro");
const painelPerfil = document.querySelector("#painel-perfil");
const cartaoCadastro = document.querySelector(".cartao-cadastro:not(.painel-perfil)");
const chavePerfil = "gavstore.perfil";

let perfilAtual = null;

function mostrarPerfil(perfil) {
  perfilAtual = perfil;
  document.querySelector("#boas-vindas-perfil").textContent = `Olá, ${perfil.nome}. Seus dados para a compra estão prontos.`;
  document.querySelector("#perfil-nome").textContent = perfil.nome;
  document.querySelector("#perfil-email").textContent = perfil.email;
  document.querySelector("#perfil-telefone").textContent = perfil.telefone;
  painelPerfil.hidden = false;
  cartaoCadastro.hidden = true;
}

function carregarPerfil() {
  try {
    const dados = localStorage.getItem(chavePerfil);
    if (!dados) {
      return;
    }

    const perfil = JSON.parse(dados);
    if (
      !perfil ||
      typeof perfil.nome !== "string" ||
      typeof perfil.email !== "string" ||
      typeof perfil.telefone !== "string"
    ) {
      throw new Error("Os dados salvos do perfil estão inválidos.");
    }

    mostrarPerfil(perfil);
  } catch (erro) {
    avisoCadastro.textContent = `Não foi possível carregar os dados do perfil. ${erro.message}`;
  }
}

function validarConfirmacaoSenha() {
  campoConfirmarSenha.setCustomValidity(
    campoConfirmarSenha.value && campoConfirmarSenha.value !== campoSenha.value
      ? "As senhas não coincidem."
      : ""
  );
}

campoSenha.addEventListener("input", validarConfirmacaoSenha);
campoConfirmarSenha.addEventListener("input", validarConfirmacaoSenha);

document.querySelector("#editar-perfil").addEventListener("click", () => {
  if (!perfilAtual) {
    return;
  }

  formularioCadastro.elements.nome.value = perfilAtual.nome;
  formularioCadastro.elements.email.value = perfilAtual.email;
  formularioCadastro.elements.telefone.value = perfilAtual.telefone;
  campoSenha.closest(".campo-cadastro").hidden = true;
  campoConfirmarSenha.closest(".campo-cadastro").hidden = true;
  campoSenha.required = false;
  campoConfirmarSenha.required = false;
  document.querySelector("#titulo-cadastro").textContent = "Atualize seus dados";
  document.querySelector("#descricao-cadastro").textContent = "Mantenha seus dados de contato atualizados para a compra.";
  formularioCadastro.querySelector(".botao-cadastro").textContent = "Salvar alterações";
  avisoCadastro.textContent = "Os dados serão atualizados somente neste navegador.";
  painelPerfil.hidden = true;
  cartaoCadastro.hidden = false;
});

formularioCadastro.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const estaEditando = Boolean(perfilAtual);
  if (!estaEditando) {
    validarConfirmacaoSenha();
  }

  if (!formularioCadastro.reportValidity()) {
    return;
  }

  const perfil = {
    nome: formularioCadastro.elements.nome.value.trim(),
    email: formularioCadastro.elements.email.value.trim(),
    telefone: formularioCadastro.elements.telefone.value.trim(),
  };

  try {
    localStorage.setItem(chavePerfil, JSON.stringify(perfil));
  } catch (erro) {
    avisoCadastro.textContent = `Não foi possível salvar seus dados neste navegador. ${erro.message}`;
    return;
  }

  if (estaEditando) {
    mostrarPerfil(perfil);
    return;
  }

  window.location.assign("carrinho.html");
});

carregarPerfil();
