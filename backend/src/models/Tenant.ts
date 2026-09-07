import {
  Column,
  CreatedAt,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { SmsTemplate } from './SmsTemplate';
import { Lead } from './Lead';
import { SmsMessage } from './SmsMessage';
import { User } from './User';

@Table({ tableName: 'tenants', underscored: true, timestamps: false })
export class Tenant extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.TEXT)
  declare name: string;

  @Column(DataType.TEXT)
  declare plivoSubaccountAuthId: string | null;

  @Column(DataType.TEXT)
  declare plivoSubaccountAuthToken: string | null;

  @Column(DataType.TEXT)
  declare senderId: string | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @HasMany(() => SmsTemplate)
  declare templates: SmsTemplate[];

  @HasMany(() => Lead)
  declare leads: Lead[];

  @HasMany(() => SmsMessage)
  declare messages: SmsMessage[];

  @HasMany(() => User)
  declare users: User[];
}
