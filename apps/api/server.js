require('dotenv').config({ path: '../../.env' }); // 또는 그냥 .env

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (for image uploads)
app.use('/assets', express.static(path.join(__dirname, '../web/public/assets')));

// Routes
app.use('/spaces', require('./routes/spaces'));
app.use('/bookings', require('./routes/bookings'));
app.use('/users', require('./routes/users'));

// Root route
app.get('/', (req, res) => {
  res.send('SPACE-API is running 🚀');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
