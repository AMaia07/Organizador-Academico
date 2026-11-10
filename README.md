# Organizador acadêmico

Aplicativo web para organizar o semestre: disciplinas, prazos de trabalhos e provas, e notas com média ponderada. Cada pessoa tem sua própria conta e só enxerga os próprios dados.

Projeto de aprendizado, criado para praticar o ciclo completo de um produto: banco de dados, autenticação, interface, segurança e publicação.

**Demonstração:** https://amaia07.github.io/Organizador-Academico/

## Funcionalidades

- Cadastro e login com e-mail e senha
- Disciplinas: adicionar, listar e remover (com professor e semestre)
- Atividades com prazo: trabalhos e provas ligados a uma disciplina
  - atrasadas aparecem em destaque
  - marcar como concluída (vai para o fim da lista, riscada)
- Notas com peso e **média ponderada** por disciplina
- Dados privados por usuário, protegidos por Row Level Security

## Tecnologias

- HTML, CSS e JavaScript puro (módulos ES, sem framework)
- [Supabase](https://supabase.com): autenticação e banco de dados PostgreSQL
- [`supabase-js`](https://github.com/supabase/supabase-js) carregado por CDN
- GitHub Pages para publicação

## Estrutura

```
index.html   página, estilos e formulários
app.js       login, disciplinas, atividades e notas
schema.sql   tabelas e regras de segurança do banco
README.md
```

## Modelo de dados

| Tabela        | Campos principais                                            |
| ------------- | ------------------------------------------------------------ |
| `disciplinas` | nome, professor, semestre                                    |
| `atividades`  | título, tipo (`trabalho` ou `prova`), data de entrega, concluída |
| `notas`       | descrição, nota (0 a 10), peso                               |

Todas têm `usuario_id`, preenchido automaticamente com o usuário logado.

## Como rodar

1. Clone o repositório.
2. Crie um projeto no [Supabase](https://supabase.com).
3. No **SQL Editor**, rode o conteúdo de `schema.sql`. Ele cria as tabelas e ativa a segurança por usuário.
4. Em **Authentication > Sign In / Providers**, deixe o provedor **Email** ativado.
5. Em **Project Settings > API**, copie a chave **publishable** (`sb_publishable_...`). A URL do projeto fica em **Integrations > Data API**.
6. No topo do `app.js`, preencha:

   ```javascript
   const SUPABASE_URL = "https://SEU-PROJETO.supabase.co"; // sem /rest/v1/ no final
   const SUPABASE_KEY = "sb_publishable_...";
   ```

7. Abra o `index.html` com um servidor local, como o Live Server ou o Live Preview do VS Code. Abrir o arquivo direto no navegador não funciona, porque o JavaScript usa módulos.
8. Em **Authentication > URL Configuration**, adicione o endereço local (por exemplo `http://127.0.0.1:3000/`) em **Redirect URLs**.

## Publicação

No GitHub, abra **Settings > Pages**, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`. Depois, no Supabase, coloque o endereço publicado em **Site URL** e em **Redirect URLs**.

## Segurança

- O código usa apenas a chave **publishable**, que pode ficar em repositório público.
- A chave **secret** (`sb_secret_...`) nunca deve aparecer no código nem no GitHub.
- O Row Level Security garante que cada usuário leia e altere somente as próprias linhas. Sem ele, a chave publishable daria acesso aos dados de todos.

## Como a média é calculada

Média ponderada por disciplina:

```
média = soma(nota × peso) ÷ soma(pesos)
```

Exemplo: nota 4 com peso 1 e nota 7 com peso 2 resultam em (4×1 + 7×2) ÷ 3 = **6,00**.

## Ideias para as próximas versões

- Editar atividades e notas
- Filtrar por semestre
- Avisos de prazos próximos
- Montar o calendário a partir do plano de ensino, com IA
- Compartilhar disciplinas e prazos com a turma

## Autor

Artur Maia, estudante de Ciência da Computação.
