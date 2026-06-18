import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Tag } from 'lucide-react';

const CATEGORY_COLORS = {
  Concert: '#7c3aed',
  Sports: '#0ea5e9',
  Theatre: '#d97706',
  Conference: '#059669',
  Festival: '#e11d48',
  Other: '#6b7280',
};

export default function EventCard({ event }) {
  const navigate = useNavigate();
  const { available } = event.availability || {};
  const color = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other;
  const date = new Date(event.dateTime);

  return (
    <article className="event-card" onClick={() => navigate(`/events/${event._id}`)}>
      <div className="event-card-accent" style={{ background: color }} />
      <div className="event-card-body">
        <div className="event-card-meta">
          <span className="badge" style={{ background: color + '22', color }}>
            <Tag size={11} />
            {event.category}
          </span>
          <span className={`avail-badge ${available === 0 ? 'avail-badge--sold' : ''}`}>
            {available === 0 ? 'Sold out' : `${available} seats left`}
          </span>
        </div>

        <h3 className="event-card-title">{event.name}</h3>

        <div className="event-card-details">
          <div className="detail-row">
            <Calendar size={14} />
            <span>
              {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}
              {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="detail-row">
            <MapPin size={14} />
            <span>{event.venue}</span>
          </div>
          <div className="detail-row">
            <Users size={14} />
            <span>{event.totalSeats} total seats</span>
          </div>
        </div>

        <div className="event-card-footer">
          <div className="event-price">
            <span className="price-label">from</span>
            <span className="price-value">₹{event.price.toLocaleString('en-IN')}</span>
          </div>
          <button
            className="btn-book"
            style={{ background: color }}
            disabled={available === 0}
            onClick={(e) => { e.stopPropagation(); navigate(`/events/${event._id}`); }}
          >
            {available === 0 ? 'Sold out' : 'Book now'}
          </button>
        </div>
      </div>
    </article>
  );
}
