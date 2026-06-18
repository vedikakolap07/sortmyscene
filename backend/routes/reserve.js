const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// POST /api/reserve
router.post('/', protect, async (req, res) => {
  const { eventId, seatNumbers } = req.body;

  if (!eventId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return res.status(400).json({ success: false, message: 'eventId and seatNumbers are required' });
  }

  const session = await mongoose.startSession();

  try {
    let reservation;

    await session.withTransaction(async () => {
      const event = await Event.findById(eventId).session(session);
      if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

      const updateResult = await Seat.updateMany(
        { eventId, seatNumber: { $in: seatNumbers }, status: 'available' },
        { $set: { status: 'reserved' } },
        { session }
      );

      if (updateResult.modifiedCount !== seatNumbers.length) {
        const conflicted = await Seat.find(
          { eventId, seatNumber: { $in: seatNumbers }, status: { $ne: 'available' } },
          { seatNumber: 1 },
          { session }
        ).lean();

        await Seat.updateMany(
          { eventId, seatNumber: { $in: seatNumbers }, status: 'reserved' },
          { $set: { status: 'available' } },
          { session }
        );

        const conflictedNums = conflicted.map((s) => s.seatNumber);
        throw Object.assign(
          new Error(`Seats no longer available: ${conflictedNums.join(', ')}`),
          { statusCode: 409, conflictedSeats: conflictedNums }
        );
      }

      await Reservation.updateMany(
        { userId: req.user._id, eventId, status: 'active' },
        { $set: { status: 'expired' } },
        { session }
      );

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      [reservation] = await Reservation.create(
        [{ userId: req.user._id, eventId, seatNumbers, expiresAt }],
        { session }
      );
    });

    res.status(201).json({ 
      success: true, 
      data: {
        ...reservation.toObject(),
        expiresAt: reservation.expiresAt,
        serverTime: new Date(),
        timeRemaining: Math.floor((reservation.expiresAt - Date.now()) / 1000)
      }
    });
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
});

// POST /api/reserve/cancel/:reservationId - Cancel a reservation and release seats
router.post('/cancel/:reservationId', protect, async (req, res) => {
  const { reservationId } = req.params;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const reservation = await Reservation.findOne(
        { _id: reservationId, userId: req.user._id, status: 'active' },
        null,
        { session }
      );

      if (!reservation) {
        throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
      }

      // Release the seats back to available
      await Seat.updateMany(
        { eventId: reservation.eventId, seatNumber: { $in: reservation.seatNumbers } },
        { $set: { status: 'available' } },
        { session }
      );

      // Mark reservation as expired
      await Reservation.findByIdAndUpdate(reservationId, { status: 'expired' }, { session });
    });

    res.json({ success: true, message: 'Reservation cancelled' });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message });
  } finally {
    await session.endSession();
  }
});

module.exports = router;