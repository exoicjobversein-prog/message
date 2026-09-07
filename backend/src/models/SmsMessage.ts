import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Tenant } from './Tenant';
import { Lead } from './Lead';
import { SmsTemplate } from './SmsTemplate';

export type SmsStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'undelivered'
  | 'failed';

@Table({ tableName: 'sms_messages', underscored: true, timestamps: false })
export class SmsMessage extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Tenant)
  @Column(DataType.UUID)
  declare tenantId: string;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;

  @ForeignKey(() => Lead)
  @Column(DataType.UUID)
  declare leadId: string | null;

  @BelongsTo(() => Lead)
  declare lead: Lead;

  @ForeignKey(() => SmsTemplate)
  @Column(DataType.UUID)
  declare templateId: string | null;

  @BelongsTo(() => SmsTemplate)
  declare template: SmsTemplate;

  @Column({ type: DataType.TEXT, field: 'to' })
  declare to: string;

  @Column(DataType.TEXT)
  declare body: string;

  @Column(DataType.TEXT)
  declare providerMessageUuid: string | null;

  @Default('queued')
  @Column(DataType.TEXT)
  declare status: SmsStatus;

  @Column(DataType.TEXT)
  declare error: string | null;

  @Column(DataType.DATE)
  declare sentAt: Date | null;

  @Column(DataType.DATE)
  declare deliveredAt: Date | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;
}
