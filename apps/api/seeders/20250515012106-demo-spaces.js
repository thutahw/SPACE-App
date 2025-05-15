'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Spaces', [
      {
        title: 'Cafe Window Wall',
        description: 'A sunny window perfect for local advertising.',
        price: 30.00, // per day
        location: 'San Francisco, CA',
        imageUrls: ['https://example.com/image1.jpg'],
        ownerId: 1, // assumes testuser1@example.com has id 1
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Boutique Restaurant Space',
        description: 'High foot traffic from shoppers and tourists.',
        price: 50.00,
        location: 'San Francisco, CA',
        imageUrls: ['https://example.com/image2.jpg'],
        ownerId: 2, // assumes admin@example.com has id 2
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete('Spaces', null, {});
  }
};
