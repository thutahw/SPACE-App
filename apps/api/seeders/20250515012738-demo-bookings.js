'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Bookings', [
      {
        startDate: new Date('2025-05-20'),
        endDate: new Date('2025-05-25'),
        status: 'confirmed',
        UserId: 1,  // Matches testuser1@example.com
        SpaceId: 1, // Matches 'Cafe Window Wall'
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-10'),
        status: 'pending',
        UserId: 2,  // Matches admin@example.com
        SpaceId: 2, // Matches 'Boutique Space'
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete('Bookings', null, {});
  }
};
