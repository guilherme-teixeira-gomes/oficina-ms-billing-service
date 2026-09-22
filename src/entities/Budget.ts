import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

/**
 * Orçamento gerado para uma OS.
 * O Billing Service é o dono dos dados de orçamento — o OS Service
 * apenas recebe o valor final via evento.
 */
@Entity("budgets")
export class Budget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  orderId: number;

  @Column({ type: "varchar", length: 60 })
  sagaId: string;

  // Valor em centavos (evita problemas de ponto flutuante com dinheiro)
  @Column({ type: "bigint", default: 0 })
  amountCents: number;

  @Column("jsonb", { nullable: true })
  items: any;

  @Column({ type: "varchar", length: 30, default: "GERADO" })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
