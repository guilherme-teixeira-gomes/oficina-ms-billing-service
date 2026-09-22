import request from "supertest";
import express from "express";
import "express-async-errors";
import { AppDataSource } from "../src/database/data-source";

jest.mock("../src/database/data-source");

import { routes } from "../src/routes/routes";

const app = express();
app.use(express.json());
app.use(routes);

describe("Rotas HTTP do Billing Service", () => {
  let mockBudgetRepo: any;
  let mockPaymentRepo: any;

  beforeEach(() => {
    mockBudgetRepo = { findOne: jest.fn() };
    mockPaymentRepo = { findOne: jest.fn() };
    (AppDataSource.getRepository as jest.Mock) = jest.fn().mockImplementation((entity: any) => {
      return entity.name === "Budget" ? mockBudgetRepo : mockPaymentRepo;
    });
  });

  it("GET budget existente retorna 200", async () => {
    mockBudgetRepo.findOne.mockResolvedValue({ id: 1, orderId: 1, amountCents: 15000 });
    const res = await request(app).get("/billing/1/budget");
    expect(res.status).toBe(200);
    expect(res.body.data.amountCents).toBe(15000);
  });

  it("GET budget inexistente retorna 404", async () => {
    mockBudgetRepo.findOne.mockResolvedValue(null);
    const res = await request(app).get("/billing/999/budget");
    expect(res.status).toBe(404);
  });

  it("GET payment existente retorna 200", async () => {
    mockPaymentRepo.findOne.mockResolvedValue({ id: 1, orderId: 1, status: "APROVADO" });
    const res = await request(app).get("/billing/1/payment");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("APROVADO");
  });

  it("GET payment inexistente retorna 404", async () => {
    mockPaymentRepo.findOne.mockResolvedValue(null);
    const res = await request(app).get("/billing/999/payment");
    expect(res.status).toBe(404);
  });
});
