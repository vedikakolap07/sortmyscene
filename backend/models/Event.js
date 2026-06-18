const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    dateTime: {
      type: Date,
      required: [true, 'Event date and time is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Must have at least 1 seat'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    category: {
      type: String,
      enum: ['Concert', 'Sports', 'Theatre', 'Conference', 'Festival', 'Other'],
      default: 'Other',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
