import { AppDataSource } from "../database/data-source";
import { Payment } from "../entities/Payment";
import { paymentGateway } from "../services/PaymentGateway";

interface EstornarInput {
  sagaId: string;
  orderId: number;
}

/**
 * Estorna o pagamento de uma OS — passo de COMPENSAÇÃO do Saga,
 * acionado quando a execução falha após o pagamento ter sido aprovado.
 */
export class EstornarPagamentoUseCase {
  async execute(input: EstornarInput): Promise<void> {
    const repo = AppDataSource.getRepository(Payment);
    const payment = await repo.findOne({
      where: { orderId: input.orderId, status: "APROVADO" },
    });
    if (!payment) return;

    await paymentGateway.refund(payment.gatewayPaymentId);
    payment.status = "ESTORNADO";
    await repo.save(payment);
  }
}
