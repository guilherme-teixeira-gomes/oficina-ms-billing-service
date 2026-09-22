/**
 * Teste BDD do fluxo de orçamento e pagamento do Billing Service.
 * Estilo Given/When/Then — requisito do Tech Challenge Fase 4.
 */
import { GerarOrcamentoUseCase } from "../src/useCases/GerarOrcamentoUseCase";
import { ProcessarPagamentoUseCase } from "../src/useCases/ProcessarPagamentoUseCase";
import { EstornarPagamentoUseCase } from "../src/useCases/EstornarPagamentoUseCase";
import { AppDataSource } from "../src/database/data-source";
import * as rabbit from "../src/messaging/rabbitmq";

jest.mock("../src/database/data-source");
jest.mock("../src/messaging/rabbitmq");

describe("FEATURE: Orçamento e pagamento de OS (Billing Service)", () => {
  let store: any[];
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    store = [];
    const repo = {
      create: jest.fn().mockImplementation((o) => o),
      save: jest.fn().mockImplementation((o) => { const r = { id: store.length + 1, ...o }; store.push(r); return Promise.resolve(r); }),
      findOne: jest.fn().mockImplementation(({ where }) => Promise.resolve(store.find((p) => p.orderId === where.orderId && (!where.status || p.status === where.status)))),
    };
    (AppDataSource.getRepository as jest.Mock) = jest.fn().mockReturnValue(repo);
    (rabbit.publishEvent as jest.Mock) = jest.fn().mockResolvedValue(undefined);
  });

  describe("CENÁRIO: Orçamento aprovado e pago", () => {
    it("DADO diagnósticos, QUANDO gera orçamento, ENTÃO calcula valor e avisa o orquestrador", async () => {
      const budget = await new GerarOrcamentoUseCase().execute({
        sagaId: "s1", orderId: 1,
        diagnostics: [{ title: "Freios", includeInBudget: true }, { title: "Óleo", includeInBudget: true }],
      });
      expect(budget.amountCents).toBe(30000);
      expect(rabbit.publishEvent).toHaveBeenCalledWith("os.orcamento-gerado", expect.objectContaining({ amountCents: 30000 }));
    });

    it("DADO um valor válido, QUANDO processa pagamento, ENTÃO aprova", async () => {
      await new ProcessarPagamentoUseCase().execute({ sagaId: "s1", orderId: 1, amountCents: 30000 });
      expect(rabbit.publishEvent).toHaveBeenCalledWith("os.pagamento-aprovado", expect.anything());
    });
  });

  describe("CENÁRIO: Compensação por falha na execução", () => {
    it("DADO um pagamento aprovado, QUANDO estorna, ENTÃO marca como ESTORNADO", async () => {
      // GIVEN um pagamento aprovado no store
      store.push({ id: 1, orderId: 1, status: "APROVADO", gatewayPaymentId: "MOCK-1" });
      // WHEN
      await new EstornarPagamentoUseCase().execute({ sagaId: "s1", orderId: 1 });
      // THEN
      expect(store[0].status).toBe("ESTORNADO");
    });
  });
});
