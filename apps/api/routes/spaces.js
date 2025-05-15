const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');

// get all spaces for frontend
router.get('/', spaceController.getAllSpaces);

// create a new space
router.post('/', spaceController.createSpace);

// get single space by id
router.get('/:id', spaceController.getSpaceById);

// get single listing of a space

module.exports = router;
