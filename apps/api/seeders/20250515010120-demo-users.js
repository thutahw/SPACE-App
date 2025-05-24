'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const hashedPassword2 = await bcrypt.hash('adminpass', 10);

    // Explicitly set IDs for foreign key consistency
    return queryInterface.bulkInsert('Users', [
      {
        id: 1,
        email: 'testuser1@example.com',
        password: hashedPassword1,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
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
