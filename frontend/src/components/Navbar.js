import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <Ticket size={22} />
        <span>SortMyScene</span>
      </Link>
      <div className="navbar-actions">
        {user ? (
          <>
            <Link to="/bookings" className="nav-link">
              <User size={16} />
              {user.name.split(' ')[0]}
            </Link>
            <button className="btn-ghost" onClick={handleLogout}>
              <LogOut size={16} />
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Sign in</Link>
            <Link to="/register" className="btn-primary-sm">Get started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
