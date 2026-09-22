import { MercadoPagoConfig, Payment as MpPayment } from "mercadopago";

export interface PaymentResult {
  approved: boolean;
  gatewayPaymentId: string;
  status: string;
  detail: string;
}

/**
 * Gateway de pagamento.
 *
 * Se MERCADOPAGO_ACCESS_TOKEN estiver definido (token de teste TEST-... ou de
 * produção), usa a integração REAL do SDK do Mercado Pago. Caso contrário, cai
 * num MODO MOCK que simula o pagamento — permitindo rodar testes e CI sem
 * credenciais, e demonstrar o fluxo do Saga mesmo sem a conta configurada.
 *
 * Regra do mock: aprova por padrão; recusa se o valor for exatamente
 * R$ 6,66 (66600 centavos) — usado para demonstrar a compensação/rollback
 * do Saga no vídeo.
 */
export class PaymentGateway {
  private token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  isMock(): boolean {
    return !this.token;
  }

  async charge(amountCents: number, description: string, payerEmail: string): Promise<PaymentResult> {
    if (this.isMock()) {
      return this.mockCharge(amountCents);
    }
    return this.realCharge(amountCents, description, payerEmail);
  }

  private mockCharge(amountCents: number): PaymentResult {
    const recusar = amountCents === 66600; // gatilho de teste para rollback
    return {
      approved: !recusar,
      gatewayPaymentId: `MOCK-${Date.now()}`,
      status: recusar ? "rejected" : "approved",
      detail: recusar ? "cc_rejected_insufficient_amount (mock)" : "accredited (mock)",
    };
  }

  private async realCharge(amountCents: number, description: string, payerEmail: string): Promise<PaymentResult> {
    const client = new MercadoPagoConfig({ accessToken: this.token as string });
    const payment = new MpPayment(client);

    const body = {
      transaction_amount: Number((amountCents / 100).toFixed(2)),
      description,
      payment_method_id: "pix",
      payer: { email: payerEmail || "test_user@testuser.com" },
    };

    const result = await payment.create({ body });
    const status = result.status || "pending";
    return {
      approved: status === "approved",
      gatewayPaymentId: String(result.id || ""),
      status,
      detail: result.status_detail || "",
    };
  }

  async refund(gatewayPaymentId: string): Promise<void> {
    if (this.isMock()) return; // no mock, estorno é no-op
    // Em produção real, chamaria a API de refund do Mercado Pago aqui.
    // Mantido simples para o escopo do Tech Challenge.
  }
}

export const paymentGateway = new PaymentGateway();
