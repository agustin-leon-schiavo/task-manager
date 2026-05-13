import { Table, Model, Column, DataType, PrimaryKey, Default, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user';

@Table({ tableName: 'tasks', paranoid: true })
export class Task extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.STRING)
  title!: string;

  @Column(DataType.TEXT)
  description?: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  completed!: boolean;

  @Default('medium')
  @Column(DataType.ENUM('low', 'medium', 'high'))
  priority!: 'low' | 'medium' | 'high';

  @Column(DataType.STRING)
  fileUrl?: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;
}