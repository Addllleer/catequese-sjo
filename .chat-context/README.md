# Catequese Paróquia São José Operário

Sistema de gestão da catequese paroquial — substitui a planilha usada
atualmente pela coordenação. Possui uma área pública de consulta (sem
login) e uma área administrativa autenticada, com permissões por perfil.

Este documento descreve a arquitetura, o modelo de dados, a autenticação,
a matriz de permissões e como colocar o sistema para rodar.

---

## 1. Arquitetura

| Camada | Tecnologia | Observação |
|---|---|---|
| Frontend/Backend | Next.js 14 (App Router) + TypeScript | Server Components para leitura, rotas de API para escrita |
| Estilo | Tailwind CSS | paleta e tipografia próprias (`tailwind.config.ts`) |
| Banco de dados | PostgreSQL | via `docker-compose.yml` incluso, ou qualquer Postgres 14+ |
| ORM | Prisma | `prisma/schema.prisma` é a fonte única de verdade do modelo |
| Autenticação | NextAuth (Credentials + JWT) | sessão de 8h, senha com hash bcrypt |
| Arquivos do Repositório | Sistema de arquivos local, fora de `/public` | trocável por S3/Blob storage futuramente (ver `src/lib/storage.ts`) |

**Por que Next.js + Postgres + Prisma:** é a stack sugerida pela própria
especificação (seção 64) e permite um único projeto cobrindo frontend,
backend e autenticação com segurança adequada para dados de menores de
idade. A autorização é sempre reconferida no servidor (Server Components e
rotas de API) — nunca depende apenas da interface esconder um botão
(seção 48/50/69 da especificação).

### Estrutura de pastas

```
prisma/schema.prisma        modelo de dados completo
prisma/seed.ts               dados de demonstração (fictícios)
src/lib/                     regras de negócio (identificador de turma,
                              permissões, conflitos, importação, auditoria)
src/components/              componentes de UI reutilizáveis
src/app/(public)/            área pública (sem login)
src/app/admin/                área administrativa (autenticada)
src/app/api/                  rotas de API (mutações e regras sensíveis)
```

---

## 2. Banco de dados — entidades e relacionamentos

Entidades principais (ver `prisma/schema.prisma` para o detalhamento
completo, incluindo comentários por seção da especificação):

- **User** — Administrador ou Responsável de Nível. `responsibleLevelId`
  é `UNIQUE`, o que garante em nível de banco que nunca haja dois
  responsáveis principais para o mesmo nível ao mesmo tempo.
- **Community** (1:N Room, 1:N Class) — São José Operário, Santa Cruz,
  São Gabriel Arcanjo. Sem campo "responsável".
- **Level** (1:N Class, 1:1 User via `responsibleUserId`) — os 6 níveis
  oficiais, com `usesYearRange` indicando se o identificador da turma
  inclui ano de início/fim (verdadeiro apenas para Crianças/Jovens/Adultos).
- **Room** — pertence a uma `Community`.
- **Catechist** ↔ **Class** — relação muitos-para-muitos via
  `CatechistOnClass`.
- **Class** — entidade central. `id` (cuid) é a chave técnica; `publicId`
  é o identificador legível gerado automaticamente (seção 9) e é único,
  mas **não** é a chave primária — pode ser recalculado se nível,
  comunidade, período ou anos forem corrigidos, sem afetar o `id` técnico
  nem os registros já vinculados a essa turma.
- **ClassYearRecord** ↔ **ClassYearRecordCatechist** — histórico por ano
  de vigência da turma (sala, catequistas e quantidade daquele ano
  específico), preservado independentemente dos dados "atuais" da turma.
- **Catechumen** — nome, data de nascimento e três booleanos de sacramento
  (`baptized`, `firstEucharist`, `confirmed`). Nenhum outro dado pessoal.
- **CalendarEvent**, **Notice**, **RepositoryDocument** — calendário,
  avisos e repositório, cada um com seu próprio campo de visibilidade.
- **AuditLog** — trilha de auditoria de ações administrativas sensíveis.

---

## 3. Autenticação

- NextAuth com provider de credenciais (e-mail + senha), sessão JWT válida
  por 8 horas.
- Senha armazenada com hash bcrypt (nunca em texto puro).
- **Catequistas não possuem conta.** O site público é a interface deles.
- `src/middleware.ts` protege `/admin/*` redirecionando quem não está
  autenticado para `/login` — isso é só uma conveniência de navegação.
  A autorização de verdade acontece em cada Server Component e cada rota
  de API (`src/lib/permissions.ts`), que reconferem sessão, perfil e
  escopo de nível a cada requisição.

---

## 4. Matriz de permissões

| Recurso | Administrador | Responsável de Nível | Público |
|---|---|---|---|
| Comunidades, Salas | Gerenciar tudo | Somente consulta | Consulta (sem gestão) |
| Níveis (descrição) | Gerenciar | Consulta | Consulta |
| Responsável de nível | Definir/alterar | — | — |
| Turmas | Gerenciar todas | Gerenciar apenas do próprio nível | Consulta (sem catequistas) |
| Catequistas (lista) | Gerenciar todas | **Ver lista completa de toda a paróquia**; cadastrar/editar dados básicos; associar a turmas apenas do próprio nível | Não vê nomes |
| Catequizandos | Acesso total | Somente do próprio nível | **Sem acesso** |
| Importação de catequizandos | Qualquer turma | Turmas do próprio nível | — |
| Sacramentos/indicadores | Todos os níveis | Somente do próprio nível | Não vê |
| Calendário | Gerenciar tudo (incl. eventos gerais) | Gerenciar eventos do próprio nível | Consulta (eventos públicos) |
| Avisos | Gerenciar tudo | **Somente consulta** (gestão é exclusiva do Administrador — seção 30) | Consulta (avisos publicados) |
| Repositório | Gerenciar tudo | Gerenciar documentos do próprio nível/categoria | Somente documentos "Público" |
| Usuários e responsáveis | Gerenciar | Sem acesso | — |
| Relatórios | Todos os dados | Somente do próprio nível | — |

A exclusão definitiva de um(a) catequista é restrita ao Administrador
(decisão técnica não detalhada explicitamente na especificação — ver
comentário em `src/app/api/catequistas/[id]/route.ts`); ambos os perfis
podem editar nome e status ativo/inativo.

---

## 5. Como funciona o identificador da turma

Implementado em `src/lib/classIdentifier.ts`, seguindo exatamente a
convenção da seção 9:

```
nivel-comunidade-periodo[-anoinicio-anofim][-n]
```

- Nível, comunidade e período: sempre presentes.
- Anos: apenas para Crianças, Jovens e Adultos.
- Sufixo `-n`: só aparece a partir da **segunda** turma com a mesma
  combinação (nunca `-1`).
- O identificador é gerado automaticamente ao criar/editar uma turma; o
  `id` técnico (cuid) nunca muda, mesmo que o identificador legível seja
  recalculado por uma correção administrativa.

## 6. Como funciona o histórico das turmas

Uma turma é uma única entidade ao longo dos anos em que existir — nunca é
recriada a cada ano. Além dos dados "atuais" (sala, catequistas,
quantidade), é possível registrar um `ClassYearRecord` por ano
(botão **"Registrar ano no histórico"** na página da turma), preservando
sala, catequistas e quantidade vigentes naquele ano específico, mesmo que
os dados atuais da turma sejam corrigidos depois.

## 7. Como funciona a importação de catequizandos

Fluxo em duas etapas, nunca uma só (seções 23/24):

1. **Prévia** (`POST /api/turmas/[id]/catequizandos/importar`): lê o
   arquivo (Excel ou CSV), valida colunas e cada linha, e devolve a lista
   completa com erros por linha — **sem gravar nada no banco**.
2. **Confirmação** (`.../importar/confirmar`): o mesmo arquivo é reenviado
   e **revalidado do zero** no servidor (nunca confia em uma prévia
   processada anteriormente pelo navegador). Se houver qualquer erro, a
   operação inteira é rejeitada — nunca há substituição parcial. Se tudo
   estiver válido, a lista atual da turma é apagada e substituída pelos
   dados do arquivo dentro de uma única transação Prisma.

Colunas aceitas (nomes flexíveis quanto a acentos/maiúsculas): **Nome**,
**Data de nascimento**, **Batismo**, **Primeira Eucaristia**, **Crisma**
(valores de sacramento aceitam Sim/Não, S/N, 1/0, x).

---

## 8. Como executar o projeto

### Pré-requisitos
- Node.js 20+
- Docker (para o Postgres local) — ou um Postgres 14+ próprio

### Passo a passo

```bash
# 1. Instalar dependências
npm install

# 2. Subir um Postgres local (usuário/senha/banco já configurados)
docker compose up -d

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite NEXTAUTH_SECRET com um valor aleatório:
openssl rand -base64 32

# 4. Criar as tabelas no banco
npm run db:migrate

# 5. Popular com dados de demonstração (fictícios)
npm run db:seed

# 6. Rodar em desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

### Variáveis de ambiente (`.env`)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | string de conexão do Postgres |
| `NEXTAUTH_SECRET` | chave usada para assinar a sessão — gere com `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL pública da aplicação (`http://localhost:3000` em desenvolvimento) |
| `STORAGE_DIR` | pasta onde os arquivos do Repositório são salvos (fora de `/public`) |

---

## 9. Como criar o primeiro administrador

O `npm run db:seed` já cria um administrador de demonstração:

- **E-mail:** `admin@catequesesjo.org.br`
- **Senha:** `Catequese@2026`

**Troque essa senha antes de qualquer uso real** (Área Administrativa →
Usuários e Responsáveis → editar o usuário). Também são criados dois
responsáveis de nível de exemplo (`jovens@catequesesjo.org.br` e
`criancas@catequesesjo.org.br`, mesma senha), para testar as permissões
restritas.

Para criar um administrador do zero em produção (sem depender do seed),
rode um script único com Prisma Client e `bcryptjs`, ou insira o usuário
inicial via `npm run db:studio` (interface visual do Prisma) — lembrando
de gerar o hash da senha com bcrypt antes de salvar, nunca texto puro.

---

## 10. Backup dos dados

- **Banco de dados:** `pg_dump` padrão do Postgres, por exemplo:
  ```bash
  pg_dump "$DATABASE_URL" -F c -f backup-catequese-$(date +%Y%m%d).dump
  ```
  Restauração: `pg_restore -d "$DATABASE_URL" backup-catequese-AAAAMMDD.dump`
- **Arquivos do Repositório:** copiar a pasta apontada por `STORAGE_DIR`
  (por padrão `storage/repository/`) — ela fica fora de `/public` e não é
  versionada no Git.
- Recomenda-se agendar os dois backups juntos e com a mesma frequência,
  já que os registros do Repositório referenciam os arquivos em disco.

---

## 11. Como adicionar novas comunidades ou níveis no futuro

- **Nova comunidade:** Área Administrativa → Comunidades → "+ Nova
  comunidade", informando nome e uma sigla nova (letras minúsculas). A
  sigla passa a ser usada automaticamente no identificador de novas
  turmas dessa comunidade — as siglas oficiais atuais (`sjop`, `stcz`,
  `sgab`) nunca devem ser alteradas, apenas novas podem ser adicionadas.
- **Novo nível:** não há tela de criação de nível pela interface, pois a
  especificação fixa os 6 níveis oficiais como vocabulário de negócio
  (seção 5). Caso a coordenação decida formalmente adicionar um nível,
  isso deve ser feito com uma migração Prisma (adicionando uma linha em
  `Level` com `slug`, `order` e `usesYearRange` definidos deliberadamente
  — nunca dividindo "Crianças" em etapas, conforme a seção 5 proíbe
  explicitamente) mais uma atualização de `OFFICIAL_LEVELS` em
  `src/lib/constants.ts`.

---

## 12. Decisões técnicas relevantes não detalhadas na especificação

Registradas aqui para transparência, seguindo a orientação de "manter a
arquitetura simples, segura, sustentável e escalável" (seção 82):

- **Banco:** PostgreSQL local via Docker Compose (a especificação já
  indicava Postgres como preferência — nenhuma adaptação foi necessária).
- **Sessão:** JWT de 8h via NextAuth, renovada a cada ação; sem "lembrar
  de mim" — adequado a um sistema com dados de menores de idade.
- **Exclusão de catequista:** restrita ao Administrador; edição de nome/
  status é permitida a ambos os perfis (ver seção 4 deste documento).
- **Avisos:** confirmando a regra explícita da seção 30, a gestão
  (criar/editar/publicar/arquivar) é exclusiva do Administrador; o
  Responsável de Nível pode apenas consultar a lista.
- **Eventos do calendário sem nível definido** ("gerais/paroquiais") só
  podem ser criados/editados pelo Administrador; eventos vinculados a um
  nível seguem o mesmo escopo das turmas.
- **Categoria de documento ⇄ nível:** no Repositório, a categoria do
  documento (ex.: "Jovens") determina automaticamente o nível vinculado
  e, portanto, quem pode gerenciá-lo; categorias "Geral" e "Formação de
  Catequistas" são exclusivas do Administrador.
- **Visão do calendário:** implementada como agenda cronológica agrupada
  por mês (em vez de uma grade visual de calendário), com os mesmos
  filtros (ano, mês, comunidade, nível, categoria) — ver seção 13 para
  observações sobre evolução futura.

---

## 13. Próximos passos sugeridos

O sistema cobre as cinco fases de implementação descritas na
especificação (seção 80), com profundidade maior nas Fases 1 e 2 (núcleo
de turmas/catequizandos/permissões) e uma base sólida, porém mais simples,
nas Fases 3 e 4. Ao expandir o projeto, esta seria a ordem sugerida:

1. **Grade visual de calendário** (mês/semana) complementando a agenda
   cronológica já existente.
2. **Redefinição de senha pelo Administrador** na tela de Usuários (hoje
   só é possível na criação do usuário).
3. **Duplicação de estrutura entre anos** (seção 47) — copiar turmas,
   salas e horários de um ano para o próximo, sem copiar listas
   individuais de catequizandos.
4. **Edição da descrição de cada nível** pela interface (hoje só via API).
5. Endurecer o armazenamento de arquivos do Repositório para um bucket
   externo (S3-compatível) em vez de disco local, caso o ambiente de
   produção seja multi-instância.

---

## 14. Guia de deploy — Vercel + Supabase (fluxo recomendado)

Esta seção descreve, em passos práticos, como publicar a aplicação
usando serviços com camada gratuita: **Vercel** para o Next.js e
**Supabase** para Postgres + Storage.

Passo a passo resumido

1) Criar repositório no GitHub e enviar (`git push origin main`).

2) Criar projeto no Supabase
   - No painel do Supabase, crie um novo projeto e copie a `DATABASE_URL`.
   - Em Storage, crie um bucket chamado `repository` (ou ajuste
     `SUPABASE_BUCKET` se escolher outro nome).
   - Copie a `Service Role` key (guarde em `SUPABASE_SERVICE_KEY`).

3) Conectar o repositório ao Vercel
   - No Vercel, importe o repositório do GitHub.
   - Em *Settings → Environment Variables* adicione (Production):
     - `DATABASE_URL` (do Supabase)
     - `NEXTAUTH_SECRET` (gere com `openssl rand -base64 32`)
     - `NEXTAUTH_URL` (ex.: `https://seu-site.vercel.app`)
     - `STORAGE_ADAPTER` = `supabase`
     - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET`

4) Migrações e seed
   - Use o workflow GitHub Actions incluído (`.github/workflows/migrate-and-seed.yml`):
     adicione `DATABASE_URL` em *GitHub → Settings → Secrets* para permitir que o
     workflow aplique `prisma migrate deploy` na `main`.
   - Alternativamente, execute manualmente (por SSH/CLI):

```bash
npx prisma migrate deploy
npm run db:seed
```

5) Testes pós-deploy
   - Acesse o site público e faça login com a conta de demonstração:
     - `admin@catequesesjo.org.br` / `Catequese@2026` (troque a senha)
   - Verifique uploads, permissões e filtros por nível/comunidade.

Observações importantes
  - Não exponha `SUPABASE_SERVICE_KEY` no cliente; mantenha-a apenas em
    variáveis de ambiente do servidor/plataforma.
  - Configure backups automáticos do banco (Supabase oferece opções)
    e rotinas de backup para o bucket de arquivos.

Se preferir, eu posso gerar instruções detalhadas com capturas de tela
para cada etapa (criar projeto no Supabase, onde colar cada secret no
Vercel, e como verificar o workflow do GitHub). Diga qual parte você
quer que eu detalhe primeiro.
