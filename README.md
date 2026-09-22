# Oficina — Billing Service

Microsserviço de **Orçamento e Pagamento** — Tech Challenge Fase 4 (Grupo MotorMind).

## Propósito

Responsável pela parte financeira do fluxo de uma OS:

- Geração de orçamento a partir dos diagnósticos
- Processamento de pagamento via **Mercado Pago**
- Estorno (compensação do Saga em caso de falha na execução)

## Tecnologias

- Node.js 20 + TypeScript + Express
- TypeORM + **PostgreSQL** (banco relacional próprio deste serviço)
- **Mercado Pago SDK** (`mercadopago`)
- RabbitMQ (mensageria assíncrona)
- Jest + Supertest (testes unitários, integração e BDD)
- Docker + Kubernetes + GitHub Actions + SonarCloud

## Papel na arquitetura (Saga)

O Billing é um **participante** do Saga orquestrado pelo OS Service. Ele reage a comandos e devolve eventos:

| Recebe (comando) | Faz | Publica (evento) |
|------------------|-----|------------------|
| billing.gerar-orcamento | calcula orçamento | os.orcamento-gerado |
| billing.processar-pagamento | cobra no Mercado Pago | os.pagamento-aprovado / os.pagamento-recusado |
| billing.estornar-pagamento | estorna (compensação) | — |

## Integração com Mercado Pago

O gateway lê o token da variável `MERCADOPAGO_ACCESS_TOKEN`:

- **Com token** (`TEST-...` sandbox ou produção) → integração real via SDK
- **Sem token** → modo **mock** automático: aprova pagamentos, exceto o valor-gatilho de **R$ 666,00** (66600 centavos), usado para demonstrar o rollback do Saga

Isso permite rodar testes e CI sem credenciais e plugar o token real na hora da demonstração, sem alterar código.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /billing/:orderId/budget | Consulta o orçamento de uma OS |
| GET | /billing/:orderId/payment | Consulta o pagamento de uma OS |
| GET | /health | Healthcheck (mostra o modo de pagamento) |

## Execução local

```bash
npm install
npm test
npm run test:coverage   # cobertura >80%
npm run dev
```

Variáveis de ambiente:

```
DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
RABBITMQ_URL
MERCADOPAGO_ACCESS_TOKEN   # opcional — vazio = modo mock
```

## Testes

- Unitários dos use-cases (orçamento, pagamento, estorno) e do gateway
- Integração das rotas HTTP (Supertest)
- **BDD** do fluxo de orçamento/pagamento e da compensação (`tests/pagamento-fluxo.bdd.spec.ts`)
- Cobertura: **~83%** (mínimo exigido: 80%)

## Deploy

Pipeline (GitHub Actions): testes + SonarCloud → build/push Docker → deploy no EKS.

Banco **PostgreSQL próprio e isolado** — nenhum outro serviço acessa este banco.
