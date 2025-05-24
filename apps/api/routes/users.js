const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// get all users (only for admin)
router.get('/', userController.getAllUsers);

// get single user
router.get('/:id', userController.getUserById);

// patch update user
router.patch('/:id', userController.updateUser);

// soft delete user
router.delete('/:id', userController.deleteUser);

// create user (only for admin)
router.post('/', userController.createUser);

// login user
router.post('/login', userController.loginUser);


module.exports = router;
