const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'booked'],
      default: 'available',
    },
    row: {
      type: String,
    },
    column: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Compound unique index: one seat number per event
seatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
