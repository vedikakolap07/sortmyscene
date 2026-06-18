import React, { useEffect, useState } from 'react';
import { eventsAPI } from '../api/client';
import EventCard from '../components/EventCard';
import { Search } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    eventsAPI.list()
      .then((res) => setEvents(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(events.map((e) => e.category))];

  const filtered = events.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || e.category === category;
    return matchesSearch && matchesCat;
  });

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <main className="events-page">
      <section className="events-hero">
        <h1>Find your next <em>scene</em></h1>
        <p>Concerts, sports, theatre and more — all in one place.</p>
      </section>

      <div className="events-controls">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search events or venues…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="category-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${category === cat ? 'filter-chip--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No events match your search.</p>
          <button onClick={() => { setSearch(''); setCategory('All'); }}>Clear filters</button>
        </div>
      ) : (
        <div className="events-grid">
          {filtered.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </main>
  );
}
