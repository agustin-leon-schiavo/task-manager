'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create enum types if they do not exist
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tasks_status') THEN
          CREATE TYPE "enum_tasks_status" AS ENUM ('todo', 'in-progress', 'done');
        END IF;
      END
      $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tasks_priority') THEN
          CREATE TYPE "enum_tasks_priority" AS ENUM ('low', 'medium', 'high');
        END IF;
      END
      $$;
    `);

    // 2. Check if table exists
    const tableExists = await queryInterface.tableExists('tasks');
    if (!tableExists) {
      await queryInterface.createTable('tasks', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false
        },
        title: {
          type: Sequelize.STRING,
          allowNull: true
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('todo', 'in-progress', 'done'),
          defaultValue: 'todo',
          allowNull: true
        },
        priority: {
          type: Sequelize.ENUM('low', 'medium', 'high'),
          defaultValue: 'medium',
          allowNull: true
        },
        fileUrl: {
          type: Sequelize.STRING,
          allowNull: true
        },
        dueDate: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        subtasks: {
          type: Sequelize.JSONB,
          defaultValue: [],
          allowNull: true
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tasks');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_priority";');
  }
};
