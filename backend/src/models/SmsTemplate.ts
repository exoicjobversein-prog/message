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

@Table({ tableName: 'sms_templates', underscored: true, timestamps: false })
export class SmsTemplate extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Tenant)
  @Column(DataType.UUID)
  declare tenantId: string;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;

  @Column(DataType.TEXT)
  declare name: string;

  @Column(DataType.TEXT)
  declare body: string;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;
}
