import { AppDataSource } from "../database/data-source";
import { Budget } from "../entities/Budget";
import { publishEvent } from "../messaging/rabbitmq";

interface GerarOrcamentoInput {
  sagaId: string;
  orderId: number;
  diagnostics: Array<{ title: string; includeInBudget: boolean }>;
}

/**
 * Gera o orçamento de uma OS a partir dos diagnósticos.
 *
 * Regra de precificação (simplificada para o escopo): cada diagnóstico
 * incluído no orçamento tem um valor base de R$ 150,00 (15000 centavos)
 * de mão de obra. Em um cenário real, consultaria um catálogo de
 * serviços/peças. O importante para a Fase 4 é o fluxo distribuído.
 */
export class GerarOrcamentoUseCase {
  private VALOR_BASE_CENTS = 15000;

  async execute(input: GerarOrcamentoInput): Promise<Budget> {
    const repo = AppDataSource.getRepository(Budget);

    const incluidos = (input.diagnostics || []).filter((d) => d.includeInBudget);
    const amountCents = incluidos.length * this.VALOR_BASE_CENTS;

    const budget = repo.create({
      orderId: input.orderId,
      sagaId: input.sagaId,
      amountCents,
      items: incluidos.map((d) => ({ descricao: d.title, valorCents: this.VALOR_BASE_CENTS })),
      status: "GERADO",
    });
    const saved = await repo.save(budget);

    // Devolve o resultado ao orquestrador (OS Service)
    await publishEvent("os.orcamento-gerado", {
      sagaId: input.sagaId,
      orderId: input.orderId,
      amountCents,
    });

    return saved;
  }
}
