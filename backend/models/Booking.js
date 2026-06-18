const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
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
    },
    seatNumbers: {
      type: [String],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    bookingReference: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Generate a short booking reference before saving
bookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    this.bookingReference =
      'SMS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
