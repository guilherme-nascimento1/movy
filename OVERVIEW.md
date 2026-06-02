# Movy — Visão Geral do Produto

## O que é o Movy?

Movy é um **SaaS multi-tenant de gestão para academias, studios e boxes** do Brasil. A plataforma centraliza tudo o que um negócio fitness precisa: alunos, financeiro, agenda, treinos, CRM de vendas, automações e inteligência artificial — em um único sistema acessível pelo navegador e por apps mobile.

O diferencial do Movy frente a concorrentes como Tecnofit, EVO e Next Fit é a **IA nativa** (Movy AI), a **adaptação automática por modalidade** e a proposta de valor acessível com planos a partir de R$149/mês.

---

## Planos e Preços

| Plano | Mensal | Anual | Limite |
|---|---|---|---|
| Starter | R$179/mês | R$149/mês | até 150 alunos |
| Business | R$319/mês | R$266/mês | até 500 alunos |
| Pro | R$549/mês | R$457/mês | ilimitado + multi-unidades |

- Trial de 14 dias grátis
- Sem taxa de setup, sem fidelidade

---

## Modalidades Suportadas

O sistema se adapta automaticamente à modalidade da academia — menus, módulos e terminologia mudam de acordo com a escolha do tenant no onboarding.

| Modalidade | Módulos específicos ativados |
|---|---|
| Musculação | Treinos, Avaliação Física, Check-in |
| CrossFit / Funcional | WOD, Ranking, PRs, Cronômetro |
| Yoga | Biblioteca de Asanas, Agenda por Estilo |
| Pilates | Agenda, Equipamentos (Reformer/Cadillac) |
| Artes Marciais | Graduação/Faixas, Combates |
| Natação | Níveis, Evolução de distância/tempo |
| Dança | Agenda por Estilo, Eventos/Apresentações |
| Studio Personal | Agenda 1:1, Pacotes de Sessões |
| Spinning / Bike Indoor | Bike Number, Manutenção de Equipamentos |
| Boxe / Muay Thai | Combates, Exames Médicos, Graduação |

---

## Arquitetura e Repositórios

```
movy/           → backend NestJS + Prisma + Supabase (este repositório)
movy-alunos/    → app mobile do aluno (React Native + Expo)
movy-gestao/    → app mobile do gestor (React Native + Expo)
movy-personal/  → produto independente para personal trainers autônomos
```

O backend é o contrato central — todos os frontends consumem a mesma API REST documentada via Swagger.

---

## Backend

### Stack

| Camada | Tecnologia |
|---|---|
| Framework | NestJS (arquitetura modular) |
| Banco de dados | PostgreSQL via Supabase (Prisma 6 ORM) |
| Cache e Filas | Redis (Upstash) + BullMQ |
| Autenticação | JWT com refresh tokens |
| Real-time | Socket.io |
| Documentação | Swagger / OpenAPI |
| Pagamentos | Asaas (PIX, boleto, recorrente) |
| WhatsApp | Evolution API |
| E-mail | Resend |
| Storage | Cloudflare R2 (fotos, GIFs de exercícios) |
| IA | Anthropic Claude API |
| Erros | Sentry |
| Deploy | Railway |

### Módulos do Backend

#### Gestão de Alunos
- Cadastro completo com foto, documentos e contatos de emergência
- Controle de matrículas, contratos e planos
- Histórico unificado: pagamentos, presença, treinos e avaliações
- Gestão de inadimplência com bloqueio automático
- Check-in por QR Code

#### Financeiro
- Fluxo de caixa, contas a pagar e receber
- Cobrança recorrente automática via Asaas (PIX, boleto, cartão)
- Régua de cobrança configurável (D-5, D0, D+3, D+7, D+15, D+30)
- Relatórios financeiros com DRE gerencial e receita por plano

#### Vendas e CRM
- Funil de vendas com estágios configuráveis
- Captação e rastreamento de origem de leads
- Agendamento de aula experimental com link público
- Automações de WhatsApp: cobrança, aniversário, ausência, reativação

#### Agenda e Aulas
- Grade de turmas com horários, capacidade e modalidade
- Agendamento online de aulas pelo aluno
- Controle de lotação com lista de espera
- Cancelamento e reagendamento com política configurável

#### Treinos e Prescrição
- Fichas de treino com exercícios, séries, repetições, carga e descanso
- Biblioteca de exercícios com GIFs demonstrativos (Cloudflare R2)
- WODs CrossFit (For Time, AMRAP, EMOM, Tabata)
- Evolução de carga com histórico por exercício

#### Avaliação Física
- Anamnese completa (histórico de saúde, objetivos, PAR-Q)
- Antropometria e composição corporal
- Avaliação postural com fotos
- Protocolos: Pollock, Jackson-Pollock, Durnin-Womersley
- Alertas automáticos de reavaliação

#### Movy AI (planos Business e Pro)
- **Churn Risk Score** — score preditivo 0–100 por aluno, calculado diariamente
- **Chat com IA** — assistente com contexto real do tenant (KPIs, inadimplentes, alunos em risco)
- **Insights mensais** — 3–5 bullets de análise do mês, com cache por tenant
- **Gerador de mensagens WhatsApp** — templates personalizados por contexto (cobrança, ausência, aniversário, reativação)
- **Sugestão de treino** — ficha prescrita por IA com base no perfil do aluno

#### Automações (BullMQ)
- Cobrança automática e régua de inadimplência
- Alertas de vencimento de plano (D-7, D-3, D0)
- Mensagens automáticas de aniversário, ausência e reativação
- Follow-up de leads
- Notificações push para apps mobile via Expo Push API

#### Outros módulos
- **Dashboard** — KPIs em tempo real (alunos ativos, receita, churn, ocupação)
- **Relatórios** — exportação em PDF e Excel (financeiro, retenção, vendas)
- **Multi-unidade** — gestão centralizada (plano Pro)
- **Gestão de Equipe** — perfis Owner, Admin, Staff, Instrutor, Personal
- **CrossFit** — WOD do dia, ranking, PRs, benchmarks clássicos
- **Artes Marciais** — controle de graduação e faixa com histórico
- **Integrações** — Wellhub, TotalPass, Asaas, catracas, ZapSign, NFSe.io

### Deploy e Infraestrutura

- **Produção:** `https://movy-production-b6e7.up.railway.app`
- **Swagger:** `https://movy-production-b6e7.up.railway.app/api/docs`
- **Banco:** Supabase PostgreSQL (pooler na porta 6543 com pgbouncer)
- **Multi-tenancy:** banco compartilhado com isolamento por `tenantId` em todas as queries

---

## Frontend Web

### Stack

| Camada | Tecnologia |
|---|---|
| Framework | TanStack Start (React 19 + SSR) |
| Build | Vite 7 |
| Linguagem | TypeScript 5.8 (strict mode) |
| Roteamento | TanStack Router (file-based) |
| Estado global | Zustand 5 |
| Data fetching | TanStack Query 5 |
| Formulários | React Hook Form + Zod |
| HTTP | Axios (interceptador de auth + token refresh automático) |
| UI | Radix UI + shadcn/ui + Tailwind CSS 4 |
| Gráficos | Recharts |
| Deploy target | Cloudflare Workers |
| Co-autor | Lovable.dev (geração assistida de UI) |

### Telas do Sistema

#### Autenticação e Onboarding
| Rota | Descrição |
|---|---|
| `/login` | Login com e-mail e senha, refresh token automático |
| `/register` | Cadastro de nova academia |
| `/onboarding` | Setup inicial pós-cadastro: modalidades, termos e cor da academia |

#### Dashboard
| Rota | Descrição |
|---|---|
| `/dashboard` | KPIs em tempo real: alunos ativos, receita, inadimplentes, novos alunos, gráfico de 6 meses |
| `/dashboard/ai` | Movy AI: churn risk, chat com IA, insights mensais e gerador de mensagens |

#### Alunos e Matrículas
| Rota | Descrição |
|---|---|
| `/students` | Lista paginada de alunos com filtros por status e busca |
| `/students/:id` | Perfil completo do aluno: dados, histórico, treinos, pagamentos e avaliações |
| `/enrollments` | Matrículas ativas: vínculo aluno → plano |
| `/plans` | Planos da academia: preço, duração e descrição |

#### Financeiro
| Rota | Descrição |
|---|---|
| `/payments` | Cobranças com status (PIX, boleto, pago, vencido, cancelado) |
| `/relatorios` | Relatórios financeiros com exportação |

#### Operações
| Rota | Descrição |
|---|---|
| `/classes` | Grade de turmas: horários, capacidade e instrutor |
| `/checkins` | Registro de check-ins por QR Code e manual |
| `/workouts` | Fichas de treino e biblioteca de exercícios |

#### Modalidades Específicas
| Rota | Módulo |
|---|---|
| `/crossfit` | WOD do dia, ranking e PRs |
| `/yoga` | Biblioteca de asanas e turmas por estilo |
| `/artes-marciais` | Graduação e histórico de faixas |
| `/boxe` | Registro de combates e exames médicos |
| `/danca` | Eventos e apresentações por estilo |
| `/natacao` | Turmas por nível e controle de atestado médico |
| `/spinning` | Gestão de bikes e manutenção |
| `/studio-personal` | Pacotes de sessões e agenda 1:1 |

#### Vendas e CRM
| Rota | Descrição |
|---|---|
| `/leads` | Funil de vendas com estágios: Novo, Contatado, Demo, Negociação, Ganho, Perdido |

#### Gestão
| Rota | Descrição |
|---|---|
| `/equipe` | Membros da equipe com perfis e metas |
| `/unidades` | Filiais/unidades (exclusivo plano Pro) |
| `/automacoes` | Configuração de automações de marketing e cobrança |
| `/notifications` | Central de notificações enviadas |

#### Configurações
| Rota | Descrição |
|---|---|
| `/settings` | Dados da academia (nome, CNPJ, endereço, redes sociais, horário), modalidades e personalização (termos, cor primária) |
| `/settings/profile` | Perfil do usuário logado |

### Funcionalidades transversais do Frontend
- **Sidebar adaptativa** — módulos exibidos mudam conforme as modalidades ativas do tenant
- **Tema claro/escuro** — com persistência em localStorage
- **Responsivo** — sidebar no desktop, bottom navigation no mobile
- **Token refresh automático** — interceptador Axios renova o JWT sem interromper o usuário
- **Chat de IA flutuante** — acessível em qualquer tela (planos Business e Pro)

---

## O que o Movy propõe

O Movy resolve um problema recorrente de academias brasileiras: **sistemas caros, genéricos e difíceis de usar** que não respeitam a especificidade de cada modalidade.

A proposta de valor em 3 pontos:

1. **Tudo em um lugar** — da matrícula ao treino, do lead ao boleto, da avaliação física ao ranking do WOD, sem precisar integrar sistemas diferentes.

2. **Adaptação por modalidade** — uma academia de CrossFit vê rankings e WODs; um studio de pilates vê reformers e focos de sessão; uma escola de dança vê estilos e apresentações. O sistema muda para cada negócio.

3. **IA nativa** — enquanto concorrentes cobram à parte ou não têm IA, o Movy entrega churn risk preditivo, chat com contexto real da academia e prescrição de treino automatizada como parte do produto.
