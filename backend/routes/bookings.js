const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// POST /api/bookings
router.post('/', protect, async (req, res) => {
  const { reservationId } = req.body;

  if (!reservationId) {
    return res.status(400).json({ success: false, message: 'reservationId is required' });
  }

  const session = await mongoose.startSession();

  try {
    let booking;

    await session.withTransaction(async () => {
      const reservation = await Reservation.findOne(
        { _id: reservationId, userId: req.user._id, status: 'active' },
        null,
        { session }
      );

      if (!reservation) {
        throw Object.assign(new Error('Reservation not found or does not belong to you'), { statusCode: 404 });
      }

      if (reservation.expiresAt < new Date()) {
        await Reservation.findByIdAndUpdate(reservationId, { status: 'expired' }, { session });
        await Seat.updateMany(
          { eventId: reservation.eventId, seatNumber: { $in: reservation.seatNumbers } },
          { $set: { status: 'available' } },
          { session }
        );
        throw Object.assign(new Error('Reservation has expired. Please reserve again.'), { statusCode: 410 });
      }

      const updateResult = await Seat.updateMany(
        { eventId: reservation.eventId, seatNumber: { $in: reservation.seatNumbers }, status: 'reserved' },
        { $set: { status: 'booked' } },
        { session }
      );

      if (updateResult.modifiedCount !== reservation.seatNumbers.length) {
        throw Object.assign(new Error('Some seats could not be confirmed. Please try again.'), { statusCode: 409 });
      }

      await Reservation.findByIdAndUpdate(reservationId, { status: 'completed' }, { session });

      const event = await Event.findById(reservation.eventId).session(session);
      const totalAmount = event ? event.price * reservation.seatNumbers.length : 0;

      [booking] = await Booking.create(
        [{ userId: req.user._id, eventId: reservation.eventId, seatNumbers: reservation.seatNumbers, totalAmount }],
        { session }
      );
    });

    const populated = await Booking.findById(booking._id)
      .populate('eventId', 'name dateTime venue')
      .lean();

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message });
  } finally {
    await session.endSession();
  }
});

// GET /api/bookings
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('eventId', 'name dateTime venue price')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;