import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Ticket } from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    bookingsAPI.list()
      .then((res) => setBookings(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <main className="bookings-page">
      <h2>My Bookings</h2>
      {bookings.length === 0 ? (
        <div className="empty-state">
          <Ticket size={40} />
          <p>No bookings yet.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Browse events</button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((b) => {
            const date = b.eventId?.dateTime ? new Date(b.eventId.dateTime) : null;
            return (
              <div key={b._id} className="booking-card">
                <div className="booking-card-header">
                  <span className="booking-ref">{b.bookingReference}</span>
                  <span className="booking-amount">₹{b.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
                <h3>{b.eventId?.name || 'Event'}</h3>
                {date && (
                  <div className="detail-row">
                    <Calendar size={14} />
                    <span>
                      {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {b.eventId?.venue && (
                  <div className="detail-row">
                    <MapPin size={14} />
                    <span>{b.eventId.venue}</span>
                  </div>
                )}
                <div className="booking-seats">
                  <Ticket size={14} />
                  <span>{b.seatNumbers.join(', ')}</span>
                </div>
                <div className="booking-booked-on">
                  Booked on {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
