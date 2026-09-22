import { PaymentGateway } from "../src/services/PaymentGateway";

describe("PaymentGateway (modo mock)", () => {
  beforeEach(() => { delete process.env.MERCADOPAGO_ACCESS_TOKEN; });

  it("deve estar em modo mock sem token", () => {
    expect(new PaymentGateway().isMock()).toBe(true);
  });

  it("deve aprovar pagamento normal", async () => {
    const r = await new PaymentGateway().charge(15000, "OS #1", "a@a.com");
    expect(r.approved).toBe(true);
    expect(r.status).toBe("approved");
  });

  it("deve recusar o valor-gatilho de rollback (66600)", async () => {
    const r = await new PaymentGateway().charge(66600, "OS #1", "a@a.com");
    expect(r.approved).toBe(false);
    expect(r.status).toBe("rejected");
  });

  it("refund no mock não deve lançar erro", async () => {
    await expect(new PaymentGateway().refund("MOCK-1")).resolves.toBeUndefined();
  });

  it("deve usar modo mercadopago quando há token", () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-123";
    expect(new PaymentGateway().isMock()).toBe(false);
  });
});
