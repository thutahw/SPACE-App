const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const multer = require('multer');
const path = require('path');

// ✅ Configure multer to use bookingId from URL params
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../web/public/assets/ad'));
  },
  filename: (req, file, cb) => {
    const bookingId = req.params.bookingId; // ✅ Get from URL params
    const ext = path.extname(file.originalname);
    cb(null, `booking-${bookingId}${ext}`);
  }
});

const upload = multer({ storage });

// ✅ Upload ad image with bookingId in the URL
router.post('/upload-ad/:bookingId', upload.single('adImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  return res.status(200).json({ message: 'Upload successful' });
});

// Booking routes
router.post('/', bookingController.createBooking);
router.get('/user/:userId', bookingController.getBookingsByUser);
router.get('/owner/:ownerId', bookingController.getBookingsByOwner);
router.patch('/:bookingId', bookingController.updateBookingStatus);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.delete('/:id', bookingController.deleteBookingPermanently);

module.exports = router;
