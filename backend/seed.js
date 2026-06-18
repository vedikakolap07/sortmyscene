require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const Seat = require('./models/Seat');

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = 10;

const events = [
  {
    name: 'The Lumineers — Brightside World Tour',
    dateTime: new Date('2025-09-15T19:30:00'),
    venue: 'NSCI Dome, Mumbai',
    totalSeats: ROWS.length * COLS,
    description: 'An unforgettable folk-rock night under the stars.',
    category: 'Concert',
    price: 1500,
  },
  {
    name: 'Mumbai Indians vs CSK — IPL Final',
    dateTime: new Date('2025-10-02T20:00:00'),
    venue: 'Wankhede Stadium, Mumbai',
    totalSeats: ROWS.length * COLS,
    description: 'The greatest T20 rivalry comes to a head.',
    category: 'Sports',
    price: 2500,
  },
  {
    name: 'Hamlet — NCPA Production',
    dateTime: new Date('2025-08-28T18:00:00'),
    venue: 'Experimental Theatre, NCPA',
    totalSeats: ROWS.length * COLS,
    description: 'A contemporary reimagining of Shakespeare\'s masterpiece.',
    category: 'Theatre',
    price: 800,
  },
  {
    name: 'Mumbai Tech Summit 2025',
    dateTime: new Date('2025-11-10T09:00:00'),
    venue: 'Jio World Convention Centre',
    totalSeats: ROWS.length * COLS,
    description: 'India\'s largest technology conference with 200+ speakers.',
    category: 'Conference',
    price: 3000,
  },
];

const generateSeats = (eventId) => {
  const seats = [];
  for (const row of ROWS) {
    for (let col = 1; col <= COLS; col++) {
      seats.push({
        eventId,
        seatNumber: `${row}${col}`,
        row,
        column: col,
        status: 'available',
      });
    }
  }
  return seats;
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Event.deleteMany({});
  await Seat.deleteMany({});
  console.log('Cleared existing data');

  for (const eventData of events) {
    const event = await Event.create(eventData);
    const seats = generateSeats(event._id);
    await Seat.insertMany(seats);
    console.log(`Created event: ${event.name} with ${seats.length} seats`);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
