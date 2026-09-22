import { ProcessarPagamentoUseCase } from "../src/useCases/ProcessarPagamentoUseCase";
import { AppDataSource } from "../src/database/data-source";
import * as rabbit from "../src/messaging/rabbitmq";

jest.mock("../src/database/data-source");
jest.mock("../src/messaging/rabbitmq");

describe("ProcessarPagamentoUseCase (modo mock)", () => {
  let mockRepo: any;
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    mockRepo = {
      create: jest.fn().mockImplementation((o) => o),
      save: jest.fn().mockImplementation((o) => Promise.resolve({ id: 1, ...o })),
    };
    (AppDataSource.getRepository as jest.Mock) = jest.fn().mockReturnValue(mockRepo);
    (rabbit.publishEvent as jest.Mock) = jest.fn().mockResolvedValue(undefined);
  });

  it("deve aprovar e publicar os.pagamento-aprovado", async () => {
    await new ProcessarPagamentoUseCase().execute({ sagaId: "s1", orderId: 1, amountCents: 15000 });
    expect(rabbit.publishEvent).toHaveBeenCalledWith("os.pagamento-aprovado", expect.objectContaining({ orderId: 1 }));
  });

  it("deve recusar valor-gatilho e publicar os.pagamento-recusado", async () => {
    await new ProcessarPagamentoUseCase().execute({ sagaId: "s1", orderId: 1, amountCents: 66600 });
    expect(rabbit.publishEvent).toHaveBeenCalledWith("os.pagamento-recusado", expect.objectContaining({ orderId: 1 }));
  });
});
