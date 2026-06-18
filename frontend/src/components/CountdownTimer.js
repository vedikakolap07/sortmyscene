import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';

export default function CountdownTimer({ expiresAt, initialTimeRemaining, onExpired }) {
  const { display, timeLeft, expired } = useCountdown(expiresAt, initialTimeRemaining);

  React.useEffect(() => {
    if (expired && onExpired) onExpired();
  }, [expired, onExpired]);

  const urgent = timeLeft <= 60 && !expired;

  return (
    <div className={`countdown ${urgent ? 'countdown--urgent' : ''} ${expired ? 'countdown--expired' : ''}`}>
      {expired ? (
        <>
          <AlertTriangle size={16} />
          <span>Reservation expired</span>
        </>
      ) : (
        <>
          <Clock size={16} />
          <span>Reserved for <strong>{display}</strong></span>
        </>
      )}
    </div>
  );
}
