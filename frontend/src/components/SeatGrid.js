import React from 'react';

export default function SeatGrid({ seats, selectedSeats, onToggle, disabled }) {
  // Group seats by row
  const rows = seats.reduce((acc, seat) => {
    const row = seat.row || seat.seatNumber[0];
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  const getStatus = (seat) => {
    if (selectedSeats.includes(seat.seatNumber)) return 'selected';
    return seat.status;
  };

  const statusLabel = { available: 'Available', reserved: 'Held', booked: 'Taken', selected: 'Selected' };

  return (
    <div className="seat-grid-wrapper">
      {/* Stage */}
      <div className="stage-bar">
        <span>STAGE</span>
      </div>

      <div className="seat-grid">
        {Object.entries(rows).map(([row, rowSeats]) => (
          <div key={row} className="seat-row">
            <span className="row-label">{row}</span>
            <div className="seat-row-seats">
              {rowSeats
                .sort((a, b) => (a.column || 0) - (b.column || 0))
                .map((seat) => {
                  const status = getStatus(seat);
                  const isClickable = (status === 'available' || status === 'selected') && !disabled;
                  return (
                    <button
                      key={seat.seatNumber}
                      className={`seat seat--${status}`}
                      title={`${seat.seatNumber} — ${statusLabel[status]}`}
                      disabled={!isClickable}
                      onClick={() => isClickable && onToggle(seat.seatNumber)}
                      aria-label={`Seat ${seat.seatNumber}, ${statusLabel[status]}`}
                      aria-pressed={status === 'selected'}
                    >
                      <span className="seat-num">{seat.column || seat.seatNumber.slice(1)}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="seat-legend">
        {[
          { key: 'available', label: 'Available' },
          { key: 'selected', label: 'Selected' },
          { key: 'reserved', label: 'Held (10 min)' },
          { key: 'booked', label: 'Taken' },
        ].map(({ key, label }) => (
          <div key={key} className="legend-item">
            <div className={`legend-swatch seat--${key}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
