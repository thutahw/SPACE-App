'use strict';

const { Space, User } = require('../models');

// Get all spaces (excluding soft-deleted ones)
exports.getAllSpaces = async (req, res) => {
  try {
    const spaces = await Space.findAll({
      where: { deleted: false }
    });
    res.status(200).json(spaces);
  } catch (error) {
    console.error('Error fetching spaces:', error);
    res.status(500).json({ error: 'Failed to fetch spaces' });
  }
};

// Create a new space
exports.createSpace = async (req, res) => {
  try {
    const { title, description, price, location, imageUrls, ownerId } = req.body;

    if (!title || !price || !ownerId) {
      return res.status(400).json({ error: 'Missing required fields: title, price, or ownerId' });
    }

    if (title && title.length > 255) {
      return res.status(400).json({ error: 'Title must be 255 characters or less.' });
    }

    const newSpace = await Space.create({
      title,
      description,
      price,
      location,
      imageUrls,
      ownerId
    });

    res.status(201).json(newSpace);
  } catch (error) {
    console.error('Error creating space:', error);
    res.status(500).json({ error: 'Failed to create space' });
  }
};

// Get a single space by ID
exports.getSpaceById = async (req, res) => {
  try {
    const spaceId = req.params.id;

    const space = await Space.findOne({
      where: { id: spaceId, deleted: false },
      include: [{
        model: User,
        attributes: ['id', 'email', 'role']
      }]
    });

    if (!space) {
      return res.status(404).json({ error: 'Space not found' });
    }

    res.status(200).json(space);
  } catch (error) {
    console.error('Error fetching space:', error);
    res.status(500).json({ error: 'Failed to fetch space' });
  }
};

// Update a space (also allows restoring soft-deleted)
exports.updateSpace = async (req, res) => {
  try {
    const spaceId = req.params.id;
    const {
      title,
      description,
      price,
      location,
      imageUrls,
      deleted,
      ownerId, // 👈 추가
    } = req.body;

    const space = await Space.findByPk(spaceId);

    if (!space || space.deleted) {
      return res.status(404).json({ error: 'Space not found or already deleted' });
    }

    if (price !== undefined && isNaN(Number(price))) {
      return res.status(400).json({ error: 'Price must be a valid number.' });
    }

    if (title !== undefined) space.title = title;
    if (description !== undefined) space.description = description;
    if (price !== undefined) space.price = price;
    if (location !== undefined) space.location = location;
    if (imageUrls !== undefined) space.imageUrls = imageUrls;
    if (deleted !== undefined) space.deleted = deleted;
    if (ownerId !== undefined) space.ownerId = ownerId; // 👈 추가

    await space.save();
    await space.reload(); // 👈 save 후 최신값 반영

    res.status(200).json(space);
  } catch (error) {
    console.error('Error updating space:', error);
    res.status(500).json({ error: 'Failed to update space' });
  }
};


// Soft delete a space
exports.deleteSpace = async (req, res) => {
  try {
    const spaceId = req.params.id;

    const space = await Space.findByPk(spaceId);

    if (!space || space.deleted) {
      return res.status(404).json({ error: 'Space not found or already deleted' });
    }

    space.deleted = true;
    await space.save();

    res.status(200).json({ message: 'Space soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting space:', error);
    res.status(500).json({ error: 'Failed to delete space' });
  }
};

// Optional authorization placeholder
const isOwnerOrAdmin = (req, res, next) => {
  const user = req.user;
  if (user.role === 'admin' || user.id === req.params.ownerId) {
    return next();
  }
  return res.status(403).json({ error: 'Not authorized' });
};
