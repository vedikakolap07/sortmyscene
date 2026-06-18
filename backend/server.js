require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/reserve', require('./routes/reserve'));
app.use('/api/bookings', require('./routes/bookings'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));


// Temporary seed route — remove after seeding
app.get('/api/seed', async (req, res) => {
  try {
    const Event = require('./models/Event');
    const Seat = require('./models/Seat');
    
    await Event.deleteMany({});
    await Seat.deleteMany({});

    const ROWS = ['A','B','C','D','E','F','G','H'];
    const COLS = 10;

    const events = [
      { name: 'The Lumineers — Brightside World Tour', dateTime: new Date('2025-09-15T19:30:00'), venue: 'NSCI Dome, Mumbai', totalSeats: 80, category: 'Concert', price: 1500, description: 'An unforgettable folk-rock night under the stars.' },
      { name: 'Mumbai Indians vs CSK — IPL Final', dateTime: new Date('2025-10-02T20:00:00'), venue: 'Wankhede Stadium, Mumbai', totalSeats: 80, category: 'Sports', price: 2500, description: 'The greatest T20 rivalry comes to a head.' },
      { name: 'Hamlet — NCPA Production', dateTime: new Date('2025-08-28T18:00:00'), venue: 'Experimental Theatre, NCPA', totalSeats: 80, category: 'Theatre', price: 800, description: "A contemporary reimagining of Shakespeare's masterpiece." },
      { name: 'Mumbai Tech Summit 2025', dateTime: new Date('2025-11-10T09:00:00'), venue: 'Jio World Convention Centre', totalSeats: 80, category: 'Conference', price: 3000, description: "India's largest technology conference with 200+ speakers." },
    ];

    for (const eventData of events) {
      const event = await Event.create(eventData);
      const seats = [];
      for (const row of ROWS) {
        for (let col = 1; col <= COLS; col++) {
          seats.push({ eventId: event._id, seatNumber: `${row}${col}`, row, column: col, status: 'available' });
        }
      }
      await Seat.insertMany(seats);
    }

    res.json({ success: true, message: 'Seeded 4 events with 80 seats each!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
