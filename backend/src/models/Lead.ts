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

@Table({ tableName: 'leads', underscored: true, timestamps: false })
export class Lead extends Model {
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
  declare name: string | null;

  @Column(DataType.TEXT)
  declare phone: string;

  @Default({})
  @Column(DataType.JSONB)
  declare extra: Record<string, unknown>;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;
}
