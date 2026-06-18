import { useState, useEffect, useRef } from 'react';

export function useCountdown(expiresAt, initialTimeRemaining = null) {
  const [timeLeft, setTimeLeft] = useState(initialTimeRemaining || 0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(0);
      return;
    }

    // Calculate initial time remaining
    const initialRemaining = initialTimeRemaining !== null 
      ? initialTimeRemaining 
      : Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
    
    // Store the start time for accurate countdown
    startTimeRef.current = Date.now();
    setTimeLeft(initialRemaining);

    // Countdown based on elapsed time from start, not recalculating from server time
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, initialRemaining - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(intervalRef.current);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [expiresAt, initialTimeRemaining]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  return { timeLeft, display: `${minutes}:${seconds}`, expired: timeLeft === 0 };
}
