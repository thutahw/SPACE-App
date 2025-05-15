module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Spaces', 'deleted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Spaces', 'deleted');
  },
};
