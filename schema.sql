-- Organizador acadêmico: esquema inicial (Supabase / Postgres)
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run.
-- Cada linha pertence a um usuário logado (auth.users).

-- 1) TABELAS -----------------------------------------------------------

create table disciplinas (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null default auth.uid()
              references auth.users(id) on delete cascade,
  nome        text not null,
  professor   text,
  semestre    text not null,              -- ex.: '2026.2'
  criado_em   timestamptz not null default now()
);

create table atividades (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  disciplina_id uuid not null
                references disciplinas(id) on delete cascade,
  titulo        text not null,
  tipo          text not null check (tipo in ('trabalho', 'prova')),
  data_entrega  date not null,
  concluida     boolean not null default false,
  criado_em     timestamptz not null default now()
);

create table notas (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  disciplina_id uuid not null
                references disciplinas(id) on delete cascade,
  descricao     text not null,            -- ex.: 'Prova 1'
  nota          numeric(4,2) not null check (nota >= 0 and nota <= 10),
  peso          numeric(4,2) not null default 1 check (peso > 0),
  criado_em     timestamptz not null default now()
);

-- Acelera a tela "próximos prazos"
create index atividades_prazos_idx on atividades (usuario_id, concluida, data_entrega);

-- 2) SEGURANÇA (Row Level Security) -------------------------------------
-- Sem isso, qualquer pessoa com a chave pública do projeto poderia ler
-- os dados de todo mundo. Com isso, cada usuário só enxerga o que é dele.

alter table disciplinas enable row level security;
alter table atividades  enable row level security;
alter table notas       enable row level security;

create policy "dono acessa suas disciplinas" on disciplinas
  for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create policy "dono acessa suas atividades" on atividades
  for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create policy "dono acessa suas notas" on notas
  for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- 3) Adição de menção ---------------------------------------------------------
alter table notas
  add column mencao text check (mencao in ('SR', 'II', 'MI', 'MM', 'MS', 'SS'));

-- 4) Adição de limite de faltas e contagem de faltas ---------------------------
alter table disciplinas
  add column limite_faltas integer check (limite_faltas > 0),
  add column faltas integer not null default 0 check (faltas >= 0);