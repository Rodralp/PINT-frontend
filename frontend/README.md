# Projeto PINT Web

Aplicacao React + Vite com backend Express em arquitetura MVC.
O backend usa PostgreSQL (via Sequelize) para autenticacao e lembretes.

## Tecnologias

- React + React Hooks
- Bootstrap
- Axios
- Express
- PostgreSQL
- Sequelize

## Estrutura (MVC no backend)

../backend/src/
- models/
- services/
- controllers/
- routes/
- app.js
- server.js

src/
- services/ (camada HTTP do frontend com Axios)
- pages/
- components/

## Autenticacao (prioridade local/session)

- O frontend verifica primeiro contas em localStorage e sessionStorage (chave: contasCriadas)
- Se nao encontrar conta local, faz chamada HTTP para a API
- Login guardado em localStorage ou sessionStorage conforme a opcao "Guardar dados"

## Base de dados

- PostgreSQL obrigatorio
- Persistencia em PostgreSQL ja ativa para:
	- contas de autenticacao
	- lembretes do consultor
- Outros datasets (dashboards, catalogo e ranking) mantem dados mock nesta fase

## Configuracao de ambiente

Configura as variaveis em .env (podes copiar de .env.example):

- VITE_API_BASE_URL=http://localhost:4000/api
Backend (`../backend/.env.example`):
- PORT=4000
- DB_HOST=localhost
- DB_PORT=5432
- DB_NAME=BD-PINT
- DB_USER=postgres
- DB_PASSWORD=postgres
- DB_LOGGING=false

Depois cria a base de dados no PostgreSQL e inicia o servidor. As tabelas sao sincronizadas automaticamente no arranque.

## Script da base de dados

O script convertido para PostgreSQL esta em:

- server/database/schema_postgresql.sql

Para criar a base e aplicar o schema automaticamente:

- npm run db:create
- npm run db:init

Ou tudo de uma vez:

- npm run db:setup

## Scripts

- npm run dev: inicia o frontend Vite em modo desenvolvimento
- npm run build: gera build de producao do frontend
- npm run lint: executa o linter do frontend
- npm run preview: preview da build do frontend

Backend separado em `../backend`:
- npm run dev: inicia o backend Express em watch mode
- npm run db:create: cria a base de dados PostgreSQL se nao existir
- npm run db:init: aplica o script SQL da base de dados
- npm run db:setup: executa db:create e db:init

## Endpoints API atuais

- GET /api/health
- GET /api/dashboard/talent-manager
- GET /api/dashboard/service-line-leader
- GET /api/dashboard/admin-gestor
- GET /api/dashboard/consultor
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/recover-password
- GET /api/consultor/catalog-badges
- GET /api/consultor/meus-badges
- GET /api/consultor/meus-pedidos
- GET /api/consultor/ranking
- GET /api/consultor/lembretes
- POST /api/consultor/lembretes
- PUT /api/consultor/lembretes/:id
- DELETE /api/consultor/lembretes/:id
- GET /api/consultor/profile

## Configuracao de API no frontend

Por omissao, o frontend usa:

- http://localhost:4000/api

Opcionalmente, podes definir VITE_API_BASE_URL para apontar para outro host.
