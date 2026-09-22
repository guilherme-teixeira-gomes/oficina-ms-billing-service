import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

/**
 * Registro de pagamento de uma OS, processado via Mercado Pago.
 */
@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  orderId: number;

  @Column({ type: "varchar", length: 60 })
  sagaId: string;

  @Column({ type: "bigint" })
  amountCents: number;

  // ID do pagamento no Mercado Pago (ou mock)
  @Column({ type: "varchar", length: 80, nullable: true })
  gatewayPaymentId: string;

  // APROVADO | RECUSADO | ESTORNADO | PENDENTE
  @Column({ type: "varchar", length: 30, default: "PENDENTE" })
  status: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  detail: string;

  @CreateDateColumn()
  createdAt: Date;
}
