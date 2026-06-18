import { useState, useEffect, useRef } from 'react';

export function useCountdown(expiresAt) {
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(0);
      return;
    }

    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));

    setTimeLeft(calc());
    intervalRef.current = setInterval(() => {
      const remaining = calc();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(intervalRef.current);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [expiresAt]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  return { timeLeft, display: `${minutes}:${seconds}`, expired: timeLeft === 0 };
}
