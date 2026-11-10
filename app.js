import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.1/+esm";

// Cole aqui os dados do SEU projeto: Supabase > Project Settings > API
// Use só a URL e a chave pública (anon / publishable). Nunca a service_role.
const SUPABASE_URL = "https://lvvibaqwhekeuvyriadt.supabase.co";
const SUPABASE_KEY = "sb_publishable_-KMMmoi1sGDkgAUaFAWRKA_XL4Fe2p4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);

function mensagem(texto, tipo = "") {
  const el = $("mensagem");
  el.textContent = texto;
  el.className = tipo; // "erro", "ok" ou vazio
}

// ---------- Login ----------

$("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  mensagem("");
  const { error } = await supabase.auth.signInWithPassword({
    email: $("email").value,
    password: $("senha").value,
  });
  if (error) mensagem("Não foi possível entrar: " + error.message, "erro");
});

$("btn-criar-conta").addEventListener("click", async () => {
  mensagem("");
  const { data, error } = await supabase.auth.signUp({
    email: $("email").value,
    password: $("senha").value,
  });
  if (error) return mensagem("Não foi possível criar a conta: " + error.message, "erro");
  if (!data.session) mensagem("Conta criada. Confirme o e-mail que enviamos e depois entre.", "ok");
});

$("btn-sair").addEventListener("click", () => supabase.auth.signOut());

// Mostra a tela certa sempre que o login muda (entrar, sair, recarregar a página)
supabase.auth.onAuthStateChange((_evento, sessao) => {
  $("tela-login").hidden = !!sessao;
  $("tela-app").hidden = !sessao;
  if (sessao) {
    $("usuario-email").textContent = sessao.user.email;
    carregarDisciplinas();
    carregarAtividades();
    carregarNotas();
  }
});

// ---------- Disciplinas ----------

async function carregarDisciplinas() {
  const { data, error } = await supabase
    .from("disciplinas")
    .select("id, nome, professor, semestre")
    .order("nome");
  if (error) return mensagem("Não foi possível carregar as disciplinas: " + error.message, "erro");

      for (const idSelect of ["atv-disciplina", "nota-disciplina"]) {
    const select = $(idSelect);
    select.replaceChildren();
    for (const d of data) {
      const opcao = document.createElement("option");
      opcao.value = d.id;
      opcao.textContent = d.nome;
      select.append(opcao);
    }
  }

  const lista = $("lista-disciplinas");
  lista.replaceChildren();

  if (data.length === 0) {
    const vazio = document.createElement("li");
    vazio.textContent = "Nenhuma disciplina ainda. Adicione a primeira acima.";
    lista.append(vazio);
    return;
  }

  for (const d of data) {
    const item = document.createElement("li");

    const info = document.createElement("div");
    info.textContent = d.nome; // textContent evita injetar HTML vindo do banco
    const detalhe = document.createElement("small");
    detalhe.textContent = [d.professor, d.semestre].filter(Boolean).join(", ");
    info.append(detalhe);

        const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "secundario pequeno";
    editar.textContent = "Editar";
    editar.addEventListener("click", () => iniciarEdicao(d));

    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "perigo";
    remover.textContent = "Remover";
    remover.addEventListener("click", () => removerDisciplina(d));

    const acoes = document.createElement("div");
    acoes.className = "linha";
    acoes.append(editar, remover);

    item.append(info, acoes);
    lista.append(item);
  }
}

let disciplinaEmEdicao = null; // guarda a disciplina que está sendo editada

$("form-disciplina").addEventListener("submit", async (e) => {
  e.preventDefault();
  mensagem("");
  const campos = {
    nome: $("nome").value.trim(),
    professor: $("professor").value.trim() || null,
    semestre: $("semestre").value.trim(),
  };

  const editando = disciplinaEmEdicao !== null;
  const { error } = editando
    ? await supabase.from("disciplinas").update(campos).eq("id", disciplinaEmEdicao.id)
    : await supabase.from("disciplinas").insert(campos);
  if (error) return mensagem("Não foi possível salvar: " + error.message, "erro");

  sairDoModoEdicao();
  mensagem(editando ? "Disciplina atualizada." : "Disciplina adicionada.", "ok");
  // O nome da disciplina aparece nas atividades e nas notas, então recarrega tudo
  carregarDisciplinas();
  carregarAtividades();
  carregarNotas();
});

function iniciarEdicao(d) {
  disciplinaEmEdicao = d;
  $("nome").value = d.nome;
  $("professor").value = d.professor ?? "";
  $("semestre").value = d.semestre;
  $("titulo-form-disciplina").textContent = "Editar disciplina";
  $("btn-salvar-disciplina").textContent = "Salvar alterações";
  $("btn-cancelar-edicao").hidden = false;
  $("form-disciplina").scrollIntoView({ behavior: "smooth" });
  $("nome").focus();
}

function sairDoModoEdicao() {
  disciplinaEmEdicao = null;
  $("form-disciplina").reset();
  $("titulo-form-disciplina").textContent = "Nova disciplina";
  $("btn-salvar-disciplina").textContent = "Adicionar disciplina";
  $("btn-cancelar-edicao").hidden = true;
}

$("btn-cancelar-edicao").addEventListener("click", sairDoModoEdicao);

async function removerDisciplina(disciplina) {
  const ok = confirm(`Remover "${disciplina.nome}"? As atividades e notas dela também serão apagadas.`);
  if (!ok) return;
  const { error } = await supabase.from("disciplinas").delete().eq("id", disciplina.id);
  if (error) return mensagem("Não foi possível remover: " + error.message, "erro");
  mensagem("Disciplina removida.", "ok");
    if (disciplinaEmEdicao?.id === disciplina.id) sairDoModoEdicao();
  carregarDisciplinas();
  carregarAtividades();
  carregarNotas();
}
// ---------- Atividades ----------

async function carregarAtividades() {
  const { data, error } = await supabase
    .from("atividades")
    .select("id, titulo, tipo, data_entrega, concluida, disciplinas(nome)")
    .order("concluida")       // pendentes primeiro
    .order("data_entrega");   // depois, as datas mais próximas
  if (error) return mensagem("Não foi possível carregar as atividades: " + error.message, "erro");

  const lista = $("lista-atividades");
  lista.replaceChildren();

  if (data.length === 0) {
    const vazio = document.createElement("li");
    vazio.textContent = "Nenhuma atividade ainda. Cadastre a primeira abaixo.";
    lista.append(vazio);
    return;
  }

  const hoje = new Date().toLocaleDateString("sv-SE"); // formato AAAA-MM-DD
  for (const a of data) {
    const item = document.createElement("li");
    if (a.concluida) item.classList.add("feita");
    if (!a.concluida && a.data_entrega < hoje) item.classList.add("atrasada");

    const caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.checked = a.concluida;
    caixa.setAttribute("aria-label", "Concluída");
    caixa.addEventListener("change", () => marcarConcluida(a.id, caixa.checked));

    const info = document.createElement("div");
    info.textContent = a.titulo;
    const detalhe = document.createElement("small");
    const data_br = a.data_entrega.split("-").reverse().join("/");
    detalhe.textContent = `${a.disciplinas.nome}, ${a.tipo}, ${data_br}`;
    info.append(detalhe);

    const esquerda = document.createElement("div");
    esquerda.className = "com-caixa";
    esquerda.append(caixa, info);

    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "perigo";
    remover.textContent = "Remover";
    remover.addEventListener("click", () => removerAtividade(a));

    item.append(esquerda, remover);
    lista.append(item);
  }
}

$("form-atividade").addEventListener("submit", async (e) => {
  e.preventDefault();
  mensagem("");
  const { error } = await supabase.from("atividades").insert({
    disciplina_id: $("atv-disciplina").value,
    titulo: $("atv-titulo").value.trim(),
    tipo: $("atv-tipo").value,
    data_entrega: $("atv-data").value,
  });
  if (error) return mensagem("Não foi possível adicionar: " + error.message, "erro");
  e.target.reset();
  mensagem("Atividade adicionada.", "ok");
  carregarAtividades();
});

async function marcarConcluida(id, concluida) {
  const { error } = await supabase.from("atividades").update({ concluida }).eq("id", id);
  if (error) mensagem("Não foi possível atualizar: " + error.message, "erro");
  carregarAtividades();
}

async function removerAtividade(atividade) {
  if (!confirm(`Remover "${atividade.titulo}"?`)) return;
  const { error } = await supabase.from("atividades").delete().eq("id", atividade.id);
  if (error) return mensagem("Não foi possível remover: " + error.message, "erro");
  mensagem("Atividade removida.", "ok");
  carregarAtividades();
}
// ---------- Notas ----------

function formatarNumero(n) {
  return n.toFixed(2).replace(".", ",");
}

function itemVazio(texto) {
  const li = document.createElement("li");
  li.textContent = texto;
  return li;
}

async function carregarNotas() {
  const { data, error } = await supabase
    .from("notas")
    .select("id, descricao, nota, peso, disciplina_id, disciplinas(nome)")
    .order("criado_em");
  if (error) return mensagem("Não foi possível carregar as notas: " + error.message, "erro");

  // Média ponderada: soma(nota × peso) ÷ soma(pesos), calculada por disciplina
  const porDisciplina = new Map();
  for (const n of data) {
    const grupo = porDisciplina.get(n.disciplina_id)
      ?? { nome: n.disciplinas.nome, somaNotas: 0, somaPesos: 0 };
    grupo.somaNotas += n.nota * n.peso;
    grupo.somaPesos += n.peso;
    porDisciplina.set(n.disciplina_id, grupo);
  }

  const medias = $("lista-medias");
  medias.replaceChildren();
  if (porDisciplina.size === 0) medias.append(itemVazio("Lance uma nota para ver a média."));
  for (const g of porDisciplina.values()) {
    const item = document.createElement("li");
    const nome = document.createElement("div");
    nome.textContent = g.nome;
    const media = document.createElement("strong");
    media.textContent = formatarNumero(g.somaNotas / g.somaPesos);
    item.append(nome, media);
    medias.append(item);
  }

  const lista = $("lista-notas");
  lista.replaceChildren();
  if (data.length === 0) lista.append(itemVazio("Nenhuma nota lançada ainda."));
  for (const n of data) {
    const item = document.createElement("li");

    const info = document.createElement("div");
    info.textContent = n.descricao;
    const detalhe = document.createElement("small");
    detalhe.textContent = `${n.disciplinas.nome}, nota ${formatarNumero(n.nota)}, peso ${formatarNumero(n.peso)}`;
    info.append(detalhe);

    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "perigo";
    remover.textContent = "Remover";
    remover.addEventListener("click", () => removerNota(n));

    item.append(info, remover);
    lista.append(item);
  }
}

$("form-nota").addEventListener("submit", async (e) => {
  e.preventDefault();
  mensagem("");
  const { error } = await supabase.from("notas").insert({
    disciplina_id: $("nota-disciplina").value,
    descricao: $("nota-descricao").value.trim(),
    nota: Number($("nota-valor").value),
    peso: Number($("nota-peso").value),
  });
  if (error) return mensagem("Não foi possível adicionar: " + error.message, "erro");
  e.target.reset();
  mensagem("Nota adicionada.", "ok");
  carregarNotas();
});

async function removerNota(nota) {
  if (!confirm(`Remover a nota "${nota.descricao}"?`)) return;
  const { error } = await supabase.from("notas").delete().eq("id", nota.id);
  if (error) return mensagem("Não foi possível remover: " + error.message, "erro");
  mensagem("Nota removida.", "ok");
  carregarNotas();
}