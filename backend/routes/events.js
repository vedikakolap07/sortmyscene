const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Seat = require('../models/Seat');

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ dateTime: 1 });

    // Enrich each event with seat availability counts
    const enriched = await Promise.all(
      events.map(async (event) => {
        const [available, reserved, booked] = await Promise.all([
          Seat.countDocuments({ eventId: event._id, status: 'available' }),
          Seat.countDocuments({ eventId: event._id, status: 'reserved' }),
          Seat.countDocuments({ eventId: event._id, status: 'booked' }),
        ]);
        return { ...event.toObject(), availability: { available, reserved, booked } };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const seats = await Seat.find({ eventId: event._id }).sort({ row: 1, column: 1 });

    res.json({ success: true, data: { event, seats } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
