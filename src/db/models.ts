import {
  Model,
  Column,
  Table,
  DataType,
  Default,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  HasMany,
  CreatedAt,
} from 'sequelize-typescript';
import { Role } from '../services/openai/types';
import { v4 as uuidv4 } from 'uuid';

export type ConversationType = {
  id: string;
  user_id: string;
  customer_id: string;
  entry: string;
  role: Role;
  created_at: string;
};

@Table({
  timestamps: false,
  tableName: 'customers',
})
export class Customer extends Model {
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at!: Date;

  @HasMany(() => Conversation)
  conversations: Conversation[];

  @HasMany(() => User)
  users: User[];
}

@Table({
  timestamps: false,
  tableName: 'users',
})
export class User extends Model {
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @ForeignKey(() => Customer)
  @Column(DataType.UUID)
  customer_id!: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at!: Date;

  @HasMany(() => Conversation)
  conversations: Conversation[];
}

@Table({
  timestamps: false,
  tableName: 'conversations',
})
export class Conversation extends Model {
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  user_id!: string;

  @AllowNull(false)
  @ForeignKey(() => Customer)
  @Column(DataType.UUID)
  customer_id!: string;

  @Column(DataType.TEXT)
  content!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(Role)))
  role!: Role;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at!: Date;
}
