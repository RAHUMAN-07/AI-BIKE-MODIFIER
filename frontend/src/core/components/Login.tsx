import React, { useState } from 'react';
import { useBikeStore } from '../stores/bikeStore';

export default function Login() {
  const login = useBikeStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login(email);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
        <div className="login-card__header">
          <div className="login-card__logo">M</div>
          <h2 className="login-card__title">Welcome to MotoForge AI</h2>
          <p className="login-card__subtitle">Your AI-Powered Motorcycle Customization Studio</p>
        </div>

        <form onSubmit={handleSubmit} className="login-card__form">
          {error && <div className="login-card__error">{error}</div>}

          <div className="login-card__field">
            <label className="login-card__label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="login-card__input"
              autoComplete="email"
            />
          </div>

          <div className="login-card__field">
            <label className="login-card__label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="login-card__input"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn--primary login-card__button"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
