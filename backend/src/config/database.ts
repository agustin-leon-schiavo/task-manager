import { Sequelize } from 'sequelize-typescript';
import { Task } from '../models/task';
import { User } from '../models/user';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      models: [Task, User],
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize({
      database: process.env.DB_NAME,
      dialect: 'postgres',
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      models: [Task, User],
      logging: false,
    });

export default sequelize;
