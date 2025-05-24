const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Create a new booking
router.post('/', bookingController.createBooking);

// Get bookings by user
router.get('/user/:userId', bookingController.getBookingsByUser);

// Get bookings by space owner
router.get('/owner/:ownerId', bookingController.getBookingsByOwner);

// Update booking status
router.patch('/:bookingId', bookingController.updateBookingStatus);

// Soft cancel booking
router.patch('/:id/cancel', bookingController.cancelBooking); // ✅ MUST be present

// DELETE: Hard delete a booking by admin
router.delete('/:id', bookingController.deleteBookingPermanently);


module.exports = router;
