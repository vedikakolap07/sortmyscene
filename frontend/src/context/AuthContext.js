import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

const initialState = { user: null, token: localStorage.getItem('sms_token'), loading: true };

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'LOGIN':
      localStorage.setItem('sms_token', action.payload.token);
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
    case 'LOGOUT':
      localStorage.removeItem('sms_token');
      return { user: null, token: null, loading: false };
    case 'DONE_LOADING':
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('sms_token');
      if (!token) return dispatch({ type: 'DONE_LOADING' });
      try {
        const res = await authAPI.me();
        dispatch({ type: 'SET_USER', payload: res.data.user });
      } catch {
        dispatch({ type: 'LOGOUT' });
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    dispatch({ type: 'LOGIN', payload: res.data });
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    dispatch({ type: 'LOGIN', payload: res.data });
    return res.data;
  };

  const logout = () => dispatch({ type: 'LOGOUT' });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
