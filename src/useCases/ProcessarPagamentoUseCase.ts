import { AppDataSource } from "../database/data-source";
import { Payment } from "../entities/Payment";
import { paymentGateway } from "../services/PaymentGateway";
import { publishEvent } from "../messaging/rabbitmq";

interface ProcessarPagamentoInput {
  sagaId: string;
  orderId: number;
  amountCents: number;
  payerEmail?: string;
}

/**
 * Processa o pagamento de uma OS via Mercado Pago.
 * Publica os.pagamento-aprovado ou os.pagamento-recusado de volta ao
 * orquestrador (OS Service), que decide o próximo passo do Saga.
 */
export class ProcessarPagamentoUseCase {
  async execute(input: ProcessarPagamentoInput): Promise<Payment> {
    const repo = AppDataSource.getRepository(Payment);

    const result = await paymentGateway.charge(
      input.amountCents,
      `OS #${input.orderId}`,
      input.payerEmail || "test_user@testuser.com"
    );

    const payment = repo.create({
      orderId: input.orderId,
      sagaId: input.sagaId,
      amountCents: input.amountCents,
      gatewayPaymentId: result.gatewayPaymentId,
      status: result.approved ? "APROVADO" : "RECUSADO",
      detail: result.detail,
    });
    const saved = await repo.save(payment);

    if (result.approved) {
      await publishEvent("os.pagamento-aprovado", {
        sagaId: input.sagaId,
        orderId: input.orderId,
        paymentId: saved.id,
      });
    } else {
      await publishEvent("os.pagamento-recusado", {
        sagaId: input.sagaId,
        orderId: input.orderId,
        reason: result.detail,
      });
    }

    return saved;
  }
}
