import cron from 'node-cron';
import { Task } from '../models/task';
import { Op } from 'sequelize';

export const initCronJobs = () => {
  // Se ejecuta todos los días a las 00:00 (medianoche)
  cron.schedule('0 0 * * *', async () => {
    console.log('--- Iniciando limpieza automática de papelera ---');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await Task.destroy({
        where: {
          deletedAt: {
            [Op.lte]: thirtyDaysAgo
          }
        },
        force: true
      });

      console.log(`--- Limpieza completada. Se eliminaron permanentemente ${deletedCount} tareas. ---`);
    } catch (error) {
      console.error('Error en la limpieza automática de la papelera:', error);
    }
  });
};
