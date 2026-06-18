const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// POST /api/reserve
router.post(
  '/',
  protect,
  async (req, res) => {
    await body('eventId').notEmpty().withMessage('eventId is required').run(req);
    await body('seatNumbers').isArray({ min: 1 }).withMessage('seatNumbers must be a non-empty array').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { eventId, seatNumbers } = req.body;
    const session = await mongoose.startSession();

    try {
      let reservation;

      await session.withTransaction(async () => {
        // Verify event exists
        const event = await Event.findById(eventId).session(session);
        if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

        // Atomically find and update only seats that are currently 'available'
        const updateResult = await Seat.updateMany(
          {
            eventId,
            seatNumber: { $in: seatNumbers },
            status: 'available',
          },
          { $set: { status: 'reserved' } },
          { session }
        );

        if (updateResult.modifiedCount !== seatNumbers.length) {
          // Some seats were not available — roll back by re-checking which ones
          const conflicted = await Seat.find(
            { eventId, seatNumber: { $in: seatNumbers }, status: { $ne: 'available' } },
            { seatNumber: 1 },
            { session }
          ).lean();

          // Revert any seats we just reserved
          await Seat.updateMany(
            {
              eventId,
              seatNumber: { $in: seatNumbers },
              status: 'reserved',
            },
            { $set: { status: 'available' } },
            { session }
          );

          const conflictedNums = conflicted.map((s) => s.seatNumber);
          throw Object.assign(
            new Error(`Seats no longer available: ${conflictedNums.join(', ')}`),
            { statusCode: 409, conflictedSeats: conflictedNums }
          );
        }

        // Cancel any existing active reservation for this user+event
        await Reservation.updateMany(
          { userId: req.user._id, eventId, status: 'active' },
          { $set: { status: 'expired' } },
          { session }
        );

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        [reservation] = await Reservation.create(
          [{ userId: req.user._id, eventId, seatNumbers, expiresAt }],
          { session }
        );
      });

      res.status(201).json({ success: true, data: reservation });
    } catch (err) {
      const status = err.statusCode || 500;
      res.status(status).json({
        success: false,
        message: err.message,
        ...(err.conflictedSeats && { conflictedSeats: err.conflictedSeats }),
      });
    } finally {
      await session.endSession();
    }
  }
);

module.exports = router;