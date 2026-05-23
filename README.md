# Movy

SaaS de gestão para academias, studios e boxes de CrossFit no Brasil.

## Estrutura do repositório

```
movy/
├── backend/    # API NestJS (Node.js 20 + TypeScript + Prisma + PostgreSQL)
└── frontend/   # App React/Next.js gerado pelo Lovable.dev
```

## Stack

**Backend**
- NestJS · TypeScript strict · Prisma 7 · PostgreSQL (Supabase)
- JWT auth · BullMQ · Socket.io · Swagger

**Integrações**
- Asaas (PIX + boleto + recorrente)
- Evolution API (WhatsApp)
- Resend (e-mail) · Cloudflare R2 (storage)

**Deploy**
- Backend: Railway (root directory: `backend`)
- Frontend: Vercel / Lovable
- Banco: Supabase · Cache: Upstash Redis

## Rodando o backend

```bash
cd backend
cp .env.example .env
# preencha DATABASE_URL e as demais variáveis no .env

npm install
npx prisma migrate dev --name init
npm run start:dev
```

Swagger disponível em `http://localhost:3001/api/docs`

## Variáveis de ambiente

Copie `backend/.env.example` para `backend/.env` e preencha:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do Supabase |
| `JWT_SECRET` | Segredo do access token |
| `JWT_REFRESH_SECRET` | Segredo do refresh token |
| `ASAAS_API_KEY` | Chave da API Asaas |
| `EVOLUTION_API_URL` | URL da Evolution API |
| `RESEND_API_KEY` | Chave do Resend |

## Scripts úteis

```bash
npm run start:dev          # dev com hot-reload
npm run build              # build de produção
npm run test               # testes unitários
npm run prisma:migrate     # nova migration
npm run prisma:studio      # GUI do banco
```

## Planos

| Plano | Preço | Alunos |
|---|---|---|
| Starter | R$ 149/mês | até 150 |
| Business | R$ 299/mês | até 500 |
| Pro | R$ 499/mês | ilimitado |

Trial gratuito de 14 dias.
