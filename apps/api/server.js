require('dotenv').config({ path: '../../.env' });
// This file is the entry point for the API server.

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors()); // allow cross-origin requests
app.use(express.json()); // parse JSON request bodies

// Routes
const spaceRoutes = require('./routes/spaces');
app.use('/spaces', spaceRoutes);

const bookingRoutes = require('./routes/bookings');
app.use('/bookings', bookingRoutes);

const userRoutes = require('./routes/users');
app.use('/users', userRoutes);

app.use(express.static('public'));

// Root route (optional)
app.get('/', (req, res) => {
  res.send('SPACE-API is running 🚀');
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server listening on http://localhost:${port}`);
});
