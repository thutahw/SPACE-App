module.exports = (sequelize, DataTypes) => {
  const Space = sequelize.define('Space', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    price: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    location: DataTypes.STRING,
    imageUrls: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  });
  
  Space.associate = (models) => {
    Space.belongsTo(models.User, { foreignKey: 'ownerId' });
  };
  
  return Space;
};
