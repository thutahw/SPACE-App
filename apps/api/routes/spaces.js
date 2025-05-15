const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');

// Get all spaces
router.get('/', spaceController.getAllSpaces);

// Create a new space
router.post('/', spaceController.createSpace);

// Get single space by ID
router.get('/:id', spaceController.getSpaceById);

// Update a space (PATCH)
router.patch('/:id', spaceController.updateSpace);

// Soft delete a space (DELETE)
router.delete('/:id', spaceController.deleteSpace); // ✅ UNCOMMENTED

module.exports = router;
