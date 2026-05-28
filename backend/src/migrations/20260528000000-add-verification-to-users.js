'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('users');
    
    if (!tableInfo.isVerified) {
      await queryInterface.addColumn('users', 'isVerified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    }
    
    if (!tableInfo.verificationCode) {
      await queryInterface.addColumn('users', 'verificationCode', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    if (!tableInfo.verificationCodeExpires) {
      await queryInterface.addColumn('users', 'verificationCodeExpires', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('users');
    
    if (tableInfo.isVerified) {
      await queryInterface.removeColumn('users', 'isVerified');
    }
    if (tableInfo.verificationCode) {
      await queryInterface.removeColumn('users', 'verificationCode');
    }
    if (tableInfo.verificationCodeExpires) {
      await queryInterface.removeColumn('users', 'verificationCodeExpires');
    }
  }
};
