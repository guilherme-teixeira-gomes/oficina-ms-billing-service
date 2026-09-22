import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { Budget } from "../entities/Budget";
import { Payment } from "../entities/Payment";

export class BillingController {
  async getBudget(req: Request, res: Response) {
    const repo = AppDataSource.getRepository(Budget);
    const budget = await repo.findOne({ where: { orderId: Number(req.params.orderId) } });
    if (!budget) return res.status(404).json({ success: false, error: "Orçamento não encontrado" });
    return res.json({ success: true, data: budget });
  }

  async getPayment(req: Request, res: Response) {
    const repo = AppDataSource.getRepository(Payment);
    const payment = await repo.findOne({ where: { orderId: Number(req.params.orderId) } });
    if (!payment) return res.status(404).json({ success: false, error: "Pagamento não encontrado" });
    return res.json({ success: true, data: payment });
  }
}
