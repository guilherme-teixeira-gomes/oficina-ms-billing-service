import { GerarOrcamentoUseCase } from "../src/useCases/GerarOrcamentoUseCase";
import { AppDataSource } from "../src/database/data-source";
import * as rabbit from "../src/messaging/rabbitmq";

jest.mock("../src/database/data-source");
jest.mock("../src/messaging/rabbitmq");

describe("GerarOrcamentoUseCase", () => {
  let mockRepo: any;
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      create: jest.fn().mockImplementation((o) => o),
      save: jest.fn().mockImplementation((o) => Promise.resolve({ id: 1, ...o })),
    };
    (AppDataSource.getRepository as jest.Mock) = jest.fn().mockReturnValue(mockRepo);
    (rabbit.publishEvent as jest.Mock) = jest.fn().mockResolvedValue(undefined);
  });

  it("deve calcular orçamento por diagnósticos incluídos (R$150 cada)", async () => {
    const budget = await new GerarOrcamentoUseCase().execute({
      sagaId: "s1", orderId: 1,
      diagnostics: [
        { title: "Troca de óleo", includeInBudget: true },
        { title: "Alinhamento", includeInBudget: true },
        { title: "Item opcional", includeInBudget: false },
      ],
    });
    expect(budget.amountCents).toBe(30000); // 2 x 15000
  });

  it("deve publicar os.orcamento-gerado", async () => {
    await new GerarOrcamentoUseCase().execute({
      sagaId: "s1", orderId: 1, diagnostics: [{ title: "X", includeInBudget: true }],
    });
    expect(rabbit.publishEvent).toHaveBeenCalledWith("os.orcamento-gerado", expect.objectContaining({ orderId: 1, amountCents: 15000 }));
  });
});
