const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    seatNumbers: {
      type: [String],
      required: [true, 'At least one seat number is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'seatNumbers must be a non-empty array',
      },
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL — auto-deletes doc after expiresAt
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);
