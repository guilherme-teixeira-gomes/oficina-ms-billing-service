import { subscribe } from "./rabbitmq";
import { GerarOrcamentoUseCase } from "../useCases/GerarOrcamentoUseCase";
import { ProcessarPagamentoUseCase } from "../useCases/ProcessarPagamentoUseCase";
import { EstornarPagamentoUseCase } from "../useCases/EstornarPagamentoUseCase";

/**
 * Registra os consumidores dos comandos que o Billing Service recebe
 * do orquestrador (OS Service) via RabbitMQ.
 */
export async function registerConsumers(): Promise<void> {
  await subscribe("billing.gerar-orcamento", "billing.gerar-orcamento", async (msg) => {
    await new GerarOrcamentoUseCase().execute(msg);
  });

  await subscribe("billing.processar-pagamento", "billing.processar-pagamento", async (msg) => {
    await new ProcessarPagamentoUseCase().execute(msg);
  });

  await subscribe("billing.estornar-pagamento", "billing.estornar-pagamento", async (msg) => {
    await new EstornarPagamentoUseCase().execute(msg);
  });
}
