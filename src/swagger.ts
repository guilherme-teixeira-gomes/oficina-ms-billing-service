import swaggerUi from "swagger-ui-express";
import { Express } from "express";

/**
 * Documentação OpenAPI do Billing Service.
 * Acessível em /api-docs quando o serviço está rodando.
 */
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Billing Service — Oficina",
    version: "1.0.0",
    description:
      "Microsserviço de Orçamento e Pagamento (Tech Challenge Fase 4). " +
      "Gera orçamentos e processa pagamentos via Mercado Pago. Participa do Saga orquestrado " +
      "consumindo comandos por RabbitMQ (billing.gerar-orcamento, billing.processar-pagamento, " +
      "billing.estornar-pagamento) e publicando eventos de volta ao OS Service.",
  },
  tags: [{ name: "Billing" }],
  paths: {
    "/billing/{orderId}/budget": {
      get: {
        tags: ["Billing"],
        summary: "Consulta o orçamento de uma OS",
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Orçamento encontrado" },
          "404": { description: "Orçamento não encontrado" },
        },
      },
    },
    "/billing/{orderId}/payment": {
      get: {
        tags: ["Billing"],
        summary: "Consulta o pagamento de uma OS",
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Pagamento encontrado (status APROVADO/RECUSADO/ESTORNADO)" },
          "404": { description: "Pagamento não encontrado" },
        },
      },
    },
    "/health": {
      get: {
        tags: ["Billing"],
        summary: "Healthcheck (mostra o modo de pagamento: mock ou mercadopago)",
        responses: { "200": { description: "ok" } },
      },
    },
  },
};

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
