# Resumo do projeto e contexto de desenvolvimento

Este documento consolida o que foi implementado no projeto de gestão da catequese em relação ao código e indica o que ainda precisa ser concluído antes de considerar o sistema pronto para uso real.

## 1) Visão geral do estado atual

O projeto já está estruturado como um sistema Next.js + TypeScript + Prisma + PostgreSQL, com separação clara entre:

- área pública: consulta de avisos, calendário, comunidades e informações gerais;
- área administrativa: gestão de usuários, níveis, comunidades, turmas, catequistas, catequizandos, documentos e eventos;
- camada de regras de negócio e autorização: em `src/lib/permissions.ts`, `src/lib/classIdentifier.ts`, `src/lib/importCatechumens.ts` e arquivos correlatos.

O principal ponto de maturidade do código é que a base do domínio foi modelada e a autorização/administração foi implementada em backend, não apenas escondida na interface.

## 2) O que foi mudado no código

### 2.1 Estrutura do banco e domínio

O schema em [prisma/schema.prisma](prisma/schema.prisma) já define as entidades centrais:

- `User` com papéis `ADMIN` e `LEVEL_RESPONSIBLE`;
- `Community`, `Level`, `Room`;
- `Catechist` e `CatechistOnClass`;
- `Class`, `ClassYearRecord`, `ClassYearRecordCatechist`;
- `Catechumen`;
- `CalendarEvent`, `Notice`, `RepositoryDocument`;
- `AuditLog`.

A modelagem já respeita algumas decisões importantes do negócio:

- `publicId` da turma é separado do `id` técnico;
- o responsável de nível é único por nível;
- há histórico de turmas por ano;
- as alterações sensíveis são registradas em log de auditoria.

### 2.2 Autenticação e autorização

A autenticação foi implementada em [src/lib/auth.ts](src/lib/auth.ts) usando NextAuth e credenciais com hash de senha via `bcryptjs`.

A autorização foi centralizada em [src/lib/permissions.ts](src/lib/permissions.ts), com funções como:

- `getSession()`;
- `requireUser()`;
- `requireAdmin()`;
- `requireLevelAccess()`;
- `canManageLevel()`;
- `manageableLevelSlugs()`;
- `apiErrorBody()`.

Isso garante que a permissão seja validada no servidor e não só na UI.

### 2.3 Identificador das turmas

O identificador legível da turma foi implementado em [src/lib/classIdentifier.ts](src/lib/classIdentifier.ts), seguindo a convenção:

`nivel-comunidade-periodo[-anoinicio-anofim][-n]`

A lógica já faz:

- incluir ano inicial/final apenas nos níveis que exigem isso;
- criar sufixo numérico apenas para colisões reais;
- evitar a convenção de `-1` na primeira turma.

### 2.4 Importação de catequizandos

A leitura e validação de planilhas foi implementada em [src/lib/importCatechumens.ts](src/lib/importCatechumens.ts).

O comportamento já inclui:

- leitura de Excel/CSV via `xlsx`;
- busca flexível de colunas por aliases (nome, nascimento, batismo, eucaristia, crisma);
- validação da data e dos valores de sacramento;
- retorno de prévia com erros por linha sem gravar no banco;
- distinção entre preview e confirmação final da importação.

### 2.5 Regras de negócio e estatísticas

O projeto também já tem módulos de apoio para:

- cálculo e agregação de dados de turmas em [src/lib/classStats.ts](src/lib/classStats.ts);
- controle de conflito e regras de negócio em [src/lib/conflicts.ts](src/lib/conflicts.ts);
- processamento e listagem de documentos em [src/lib/documents.ts](src/lib/documents.ts);
- listagem de eventos em [src/lib/events.ts](src/lib/events.ts);
- regras de visualização e de avisos em [src/lib/notices.ts](src/lib/notices.ts);
- auditoria em [src/lib/audit.ts](src/lib/audit.ts).

### 2.6 Administração e páginas

A área administrativa já foi organizada em rotas do App Router, com páginas em [src/app/admin](src/app/admin) e componentes reutilizáveis em [src/components](src/components).

As partes mais consolidadas incluem:

- dashboard administrativo;
- gestão de comunidades;
- gestão de níveis;
- gestão de turmas;
- gestão de catequistas;
- importação de catequizandos;
- calendário;
- avisos;
- repositório;
- usuários e responsáveis;
- relatórios.

## 3) O que ainda deve ser feito

O código está avançado, mas ainda há trabalho importante antes de um uso real/produção.

### 3.1 Revisão de UX e consistência visual

Há uma base bem definida, mas ainda é importante revisar:

- padronização de formulários;
- mensagens de erro/feedback de usuário;
- consistência de botões, filtros e estados vazios;
- claro entendimento de páginas públicas versus administrativas.

### 3.2 Finalização de fluxos críticos

Os fluxos mais sensíveis precisam de revisão final em uso real:

- criação e edição de turmas;
- importação em lote de catequizandos;
- alteração de responsável de nível e permissões;
- exclusão e atualização de entidades vinculadas;
- registro histórico anual da turma.

### 3.3 Validação de casos de borda e segurança

Ainda vale uma checagem funcional em cenários como:

- turmas duplicadas com mesmo identificador;
- permissões de nível para usuário responsável;
- acesso indevido em rotas e manipulação de dados;
- arquivos de importação com dados incompletos ou inválidos;
- integração entre `ClassYearRecord` e estado atual da classe.

### 3.4 Testes automatizados

Até o momento, o projeto parece estar orientado mais para implementação funcional do que para automação. O próximo passo é incluir:

- testes unitários para módulos de validação e geração de identificadores;
- testes de rota/serviço para autorização e mutações sensíveis;
- testes de importação de planilhas com casos válidos e inválidos.

### 3.5 Limpeza e documentação operacional

Ainda falta consolidar:

- checklist de operação para admin;
- documentação de regras de negócio para cada fluxo;
- preenchimento de exemplos reais de uso;
- revisão final de mensagens e legibilidade do README para uso real.

## 4) O que foi entregue de forma mais madura no código

Os pontos mais sólidos já implementados são:

1. autenticação e autorização no servidor;
2. modelagem completa do domínio no Prisma;
3. regra de identificador único das turmas;
4. histórico anual das turmas;
5. importação com validação de dados;
6. auditoria de ações sensíveis;
7. separação entre área pública e administrativa.

Esses elementos já dão uma base forte para continuar sem depender de um histórico perdido do OneDrive.

## 5) Comandos para o próximo chat manter o contexto

Os comandos abaixo devem ser executados no repositório e vão salvar em um arquivo de contexto legível para o próximo atendimento:

```bash
git status --short --branch > .chat-context/git-status.txt
git log --oneline --decorate --graph --all > .chat-context/git-history.txt
git remote -v > .chat-context/git-remote.txt

mkdir -p .chat-context

cp README.md .chat-context/README.md
cp prisma/schema.prisma .chat-context/schema.prisma
cp src/lib/permissions.ts .chat-context/permissions.ts
cp src/lib/classIdentifier.ts .chat-context/classIdentifier.ts
cp src/lib/importCatechumens.ts .chat-context/importCatechumens.ts

find src -maxdepth 3 -type f | sort > .chat-context/src-files.txt

grep -RInE "TODO|FIXME|pendente|deve|falt|revisar|ainda" src prisma README.md . 2>/dev/null > .chat-context/todo-notes.txt || true

printf "\n--- CONTEXTO RESUMIDO ---\n" > .chat-context/contexto.txt
cat RESUMO_PROJETO.md >> .chat-context/contexto.txt
```

Se quiser algo mais enxuto para o próximo chat, basta usar:

```bash
cat .chat-context/contexto.txt
cat .chat-context/git-history.txt
```

## 6) Recomendação prática

Quando o projeto deixar o OneDrive, o que deve ser preservado como fonte de verdade é:

- o repositório GitHub;
- a pasta `.chat-context` com o resumo e o histórico;
- o `README.md` e o `prisma/schema.prisma` como documento de referência principal.

Com isso, qualquer próximo chat terá contexto suficiente para continuar a implementação sem depender do arquivo local do OneDrive.
