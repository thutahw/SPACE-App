'use strict';

const { Booking, Space, User } = require('../models');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { startDate, endDate, UserId, SpaceId } = req.body;

    if (!startDate || !endDate || !UserId || !SpaceId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const newBooking = await Booking.create({
      startDate,
      endDate,
      UserId,
      SpaceId,
      status: 'pending'
    });

    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// Get all bookings made by a specific user
exports.getBookingsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const bookings = await Booking.findAll({
      where: { UserId: userId },
      include: [Space]
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// Get all bookings received by a space owner
exports.getBookingsByOwner = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;

    const bookings = await Booking.findAll({
      include: [
        {
          model: Space,
          where: { ownerId: ownerId }
        },
        {
          model: User
        }
      ]
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings for owner' });
  }
};

// Update booking status (accept/reject)
exports.updateBookingStatus = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const { status } = req.body;

    // Validate input
    const validStatuses = ['pending', 'confirmed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json(booking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// Permanently delete a booking
exports.deleteBookingPermanently = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const deleted = await Booking.destroy({ where: { id: bookingId } });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Booking not found or already deleted' });
    }

    res.status(200).json({ message: 'Booking permanently deleted' });
  } catch (error) {
    console.error('Error deleting booking permanently:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};
