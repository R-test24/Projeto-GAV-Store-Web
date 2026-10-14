const CHAVE_ACESSOS_LOJA = "gavstore.acessos";

if (document.body.id === "Inicio") {
  try {
    const acessosSalvos = localStorage.getItem(CHAVE_ACESSOS_LOJA);
    const acessos = acessosSalvos === null ? 0 : Number(acessosSalvos);
    if (!Number.isSafeInteger(acessos) || acessos < 0) {
      throw new Error("O contador de acessos salvo está inválido.");
    }
    localStorage.setItem(CHAVE_ACESSOS_LOJA, String(acessos + 1));
  } catch (erro) {
    console.error("Não foi possível registrar o acesso à loja neste navegador.", erro);
  }
}
