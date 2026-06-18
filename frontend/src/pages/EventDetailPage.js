import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { eventsAPI, reserveAPI, bookingsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeatGrid from '../components/SeatGrid';
import CountdownTimer from '../components/CountdownTimer';
import { Calendar, MapPin, ArrowLeft, CheckCircle } from 'lucide-react';

const STEPS = { SELECT: 'select', RESERVED: 'reserved', BOOKED: 'booked' };

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [step, setStep] = useState(STEPS.SELECT);
  const [reservation, setReservation] = useState(null);
  const [booking, setBooking] = useState(null);
  const [working, setWorking] = useState(false);

  const fetchEvent = useCallback(() => {
    return eventsAPI.get(id).then((res) => {
      setEvent(res.data.data.event);
      setSeats(res.data.data.seats);
    });
  }, [id]);

  useEffect(() => {
    fetchEvent()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fetchEvent]);

  const toggleSeat = (seatNumber) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNumber) ? prev.filter((s) => s !== seatNumber) : [...prev, seatNumber]
    );
  };

  const handleReserve = async () => {
    if (!user) return navigate('/login');
    if (selectedSeats.length === 0) return toast.error('Please select at least one seat.');
    setWorking(true);
    try {
      const res = await reserveAPI.reserve({ eventId: id, seatNumbers: selectedSeats });
      setReservation(res.data.data);
      // Optimistically update seat statuses
      setSeats((prev) =>
        prev.map((s) =>
          selectedSeats.includes(s.seatNumber) ? { ...s, status: 'reserved' } : s
        )
      );
      setStep(STEPS.RESERVED);
      toast.success('Seats reserved! You have 10 minutes to confirm.');
    } catch (err) {
      toast.error(err.message);
      if (err.response?.data?.conflictedSeats) {
        // Refresh seat statuses to show conflicts
        fetchEvent().catch(() => {});
        setSelectedSeats([]);
      }
    } finally {
      setWorking(false);
    }
  };

  const handleConfirmBooking = async () => {
    setWorking(true);
    try {
      const res = await bookingsAPI.confirm({ reservationId: reservation._id });
      setBooking(res.data.data);
      setStep(STEPS.BOOKED);
      toast.success('Booking confirmed!');
    } catch (err) {
      toast.error(err.message);
      if (err.response?.status === 410) {
        // Reservation expired
        setStep(STEPS.SELECT);
        setSelectedSeats([]);
        setReservation(null);
        fetchEvent().catch(() => {});
      }
    } finally {
      setWorking(false);
    }
  };

  const handleReservationExpired = useCallback(() => {
    if (step === STEPS.RESERVED) {
      toast.error('Your reservation expired. Please select seats again.');
      setStep(STEPS.SELECT);
      setSelectedSeats([]);
      setReservation(null);
      fetchEvent().catch(() => {});
    }
  }, [step, fetchEvent]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (error) return <div className="page-error">{error}</div>;

  const date = new Date(event.dateTime);
  const totalPrice = selectedSeats.length * (event?.price || 0);

  // ── Booking success screen ────────────────────────────
  if (step === STEPS.BOOKED && booking) {
    return (
      <main className="booking-success-page">
        <div className="success-card">
          <CheckCircle size={56} className="success-icon" />
          <h2>You're going!</h2>
          <p className="booking-ref">Ref: <strong>{booking.bookingReference}</strong></p>
          <div className="booking-details">
            <div><span>Event</span><strong>{booking.eventId?.name}</strong></div>
            <div><span>Seats</span><strong>{booking.seatNumbers.join(', ')}</strong></div>
            <div><span>Total paid</span><strong>₹{booking.totalAmount?.toLocaleString('en-IN')}</strong></div>
          </div>
          <button className="btn-primary" onClick={() => navigate('/bookings')}>View all bookings</button>
          <button className="btn-ghost" onClick={() => navigate('/')}>Browse more events</button>
        </div>
      </main>
    );
  }

  return (
    <main className="event-detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="event-detail-header">
        <div>
          <span className="badge badge--category">{event.category}</span>
          <h1>{event.name}</h1>
          <div className="detail-row"><Calendar size={15} />
            <span>
              {date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}
              {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="detail-row"><MapPin size={15} /><span>{event.venue}</span></div>
          {event.description && <p className="event-desc">{event.description}</p>}
        </div>
        <div className="event-price-tag">
          <span>from</span>
          <strong>₹{event.price.toLocaleString('en-IN')}</strong>
          <span>per seat</span>
        </div>
      </div>

      {/* Countdown when reserved */}
      {step === STEPS.RESERVED && reservation && (
        <CountdownTimer expiresAt={reservation.expiresAt} onExpired={handleReservationExpired} />
      )}

      <SeatGrid
        seats={seats}
        selectedSeats={selectedSeats}
        onToggle={toggleSeat}
        disabled={step !== STEPS.SELECT}
      />

      {/* Booking panel */}
      <div className="booking-panel">
        {step === STEPS.SELECT && (
          <>
            <div className="booking-summary">
              {selectedSeats.length > 0 ? (
                <>
                  <span>{selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected: {selectedSeats.join(', ')}</span>
                  <strong>₹{totalPrice.toLocaleString('en-IN')}</strong>
                </>
              ) : (
                <span className="hint">Select seats above to begin</span>
              )}
            </div>
            <button
              className="btn-primary"
              onClick={handleReserve}
              disabled={selectedSeats.length === 0 || working}
            >
              {working ? 'Reserving…' : `Reserve ${selectedSeats.length > 0 ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}` : 'seats'}`}
            </button>
          </>
        )}

        {step === STEPS.RESERVED && (
          <>
            <div className="booking-summary">
              <span>Seats: <strong>{reservation?.seatNumbers?.join(', ')}</strong></span>
              <strong>₹{(reservation?.seatNumbers?.length * event.price).toLocaleString('en-IN')}</strong>
            </div>
            <button className="btn-primary btn-confirm" onClick={handleConfirmBooking} disabled={working}>
              {working ? 'Confirming…' : 'Confirm booking'}
            </button>
            <button className="btn-ghost" onClick={() => { setStep(STEPS.SELECT); setSelectedSeats([]); setReservation(null); fetchEvent(); }}>
              Change seats
            </button>
          </>
        )}
      </div>
    </main>
  );
}
