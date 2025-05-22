const { User } = require('../models');

// GET all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ where: { deleted: false } });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

// GET single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.deleted) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { email, password, role, deleted, name } = req.body;

    // Optional: prevent updates to deleted users unless restoring
    if (user.deleted && deleted !== false) {
      return res.status(403).json({ error: 'User is deleted and cannot be modified' });
    }

    if (email !== undefined) user.email = email;
    if (password !== undefined) user.password = password; // auto-hashed via hook
    if (role !== undefined) user.role = role;
    if (deleted !== undefined) user.deleted = deleted;
    if (name !== undefined) user.name = name;

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};


// DELETE soft delete
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.deleted) return res.status(404).json({ error: 'User not found' });

    user.deleted = true;
    await user.save();
    res.status(200).json({ message: 'User soft-deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// POST create user
// Note: This should be an admin-only action in a real app
// Note: Password hashing should be done in the model or a service
exports.createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const newUser = await User.create({ email, password, role });
    res.status(201).json({ id: newUser.id, email: newUser.email, role: newUser.role });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// POST login
// Note: This should be a public action
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await user.validPassword(password);
    if (!isValid) return res.status(401).json({ error: 'Incorrect password' });

    res.status(200).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

