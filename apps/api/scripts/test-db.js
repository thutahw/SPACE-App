const { sequelize, User, Space, Booking } = require('../models');

async function test() {
  await sequelize.sync({ force: false }); // Optional: Recreate tables
  const user = await User.create({ email: 'test@space.com', password: '123456' });
  const space = await Space.create({ title: 'Test Wall', price: 100, ownerId: user.id });
  const booking = await Booking.create({ startDate: new Date(), endDate: new Date(), UserId: user.id, SpaceId: space.id });
  console.log('Data created:', { user, space, booking });
}

test();
