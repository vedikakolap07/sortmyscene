const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// POST /api/bookings
router.post(
  '/',
  protect,
  [body('reservationId').notEmpty().withMessage('reservationId is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { reservationId } = req.body;
    const session = await mongoose.startSession();

    try {
      let booking;

      await session.withTransaction(async () => {
        // Fetch reservation and verify ownership
        const reservation = await Reservation.findOne(
          { _id: reservationId, userId: req.user._id, status: 'active' },
          null,
          { session }
        );

        if (!reservation) {
          throw Object.assign(new Error('Reservation not found or does not belong to you'), {
            statusCode: 404,
          });
        }

        // Check expiry
        if (reservation.expiresAt < new Date()) {
          await Reservation.findByIdAndUpdate(
            reservationId,
            { status: 'expired' },
            { session }
          );
          // Also free up the seats
          await Seat.updateMany(
            { eventId: reservation.eventId, seatNumber: { $in: reservation.seatNumbers } },
            { $set: { status: 'available' } },
            { session }
          );
          throw Object.assign(new Error('Reservation has expired. Please reserve again.'), {
            statusCode: 410,
          });
        }

        // Mark seats as booked
        const updateResult = await Seat.updateMany(
          {
            eventId: reservation.eventId,
            seatNumber: { $in: reservation.seatNumbers },
            status: 'reserved',
          },
          { $set: { status: 'booked' } },
          { session }
        );

        if (updateResult.modifiedCount !== reservation.seatNumbers.length) {
          throw Object.assign(new Error('Some seats could not be confirmed. Please try again.'), {
            statusCode: 409,
          });
        }

        // Mark reservation as completed
        await Reservation.findByIdAndUpdate(
          reservationId,
          { status: 'completed' },
          { session }
        );

        // Fetch event for pricing
        const event = await Event.findById(reservation.eventId).session(session);
        const totalAmount = event ? event.price * reservation.seatNumbers.length : 0;

        // Create booking record
        [booking] = await Booking.create(
          [
            {
              userId: req.user._id,
              eventId: reservation.eventId,
              seatNumbers: reservation.seatNumbers,
              totalAmount,
            },
          ],
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
  }
);

// GET /api/bookings — user's booking history
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
