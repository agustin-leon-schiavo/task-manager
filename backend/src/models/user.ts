import { Table, Model, Column, DataType, PrimaryKey, Default, Unique, HasMany, BeforeCreate, BeforeUpdate } from 'sequelize-typescript';
import { Task } from './task';
import bcrypt from 'bcryptjs';

@Table({ tableName: 'users' })
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Unique
  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    }
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password!: string;

  @Default('user')
  @Column(DataType.ENUM('user', 'admin'))
  role!: 'user' | 'admin';

  @HasMany(() => Task)
  tasks!: Task[];

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if (instance.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
