'use strict';

const { Space, User } = require('../models');

// Get all spaces for frontend
exports.getAllSpaces = async (req, res) => {
  try {
    const spaces = await Space.findAll();
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

    const space = await Space.findByPk(spaceId, {
  include: [{
    model: User,
    attributes: ['id', 'email', 'role'] // exclude password
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
