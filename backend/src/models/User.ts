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

export type UserRole = 'admin' | 'tenant';

@Table({ tableName: 'users', underscored: true, timestamps: false })
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.TEXT)
  declare email: string;

  @Column(DataType.TEXT)
  declare passwordHash: string;

  @Default('tenant')
  @Column(DataType.TEXT)
  declare role: UserRole;

  @ForeignKey(() => Tenant)
  @Column(DataType.UUID)
  declare tenantId: string | null;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;
}
