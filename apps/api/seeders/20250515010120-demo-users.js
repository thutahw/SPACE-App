'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const hashedPassword2 = await bcrypt.hash('adminpass', 10);

    return queryInterface.bulkInsert('Users', [
      {
        email: 'testuser1@example.com',
        password: hashedPassword1,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'admin@example.com',
        password: hashedPassword2,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
