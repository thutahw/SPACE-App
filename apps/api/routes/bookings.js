const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// create a new booking
router.post('/', bookingController.createBooking);

// get all bookings made by a specific user (advertiser)
router.get('/user/:userId', bookingController.getBookingsByUser);

// get all bookings made by a specific owner of a space
router.get('/owner/:ownerId', bookingController.getBookingsByOwner);

//space owner can accept or reject a booking
router.patch('/:bookingId', bookingController.updateBookingStatus);


module.exports = router;
// This code defines an Express router for handling booking-related routes.
// It imports the necessary modules, creates a router instance, and sets up a POST route for creating bookings.