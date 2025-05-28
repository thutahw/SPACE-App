// src/pages/BookingDashboard.jsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import '../styles/BookingDashboard.css';

const BookingDashboard = () => {
  const { user } = useAuth();
  const [myBookings, setMyBookings] = useState([]);
  const [incomingBookings, setIncomingBookings] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [error, setError] = useState('');

  const apiBaseUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!user) return;

    // Fetch bookings made by this user
    fetch(`${apiBaseUrl}/bookings/user/${user.id}`)
      .then(res => res.json())
      .then(data => setMyBookings(data))
      .catch(err => {
        console.error('Failed to fetch my bookings', err);
        setError('Failed to fetch your bookings.');
      });

    // Fetch bookings received by this user if they are a space owner
    fetch(`${apiBaseUrl}/bookings/owner/${user.id}`)
      .then(res => res.json())
      .then(data => setIncomingBookings(data))
      .catch(err => {
        console.error('Failed to fetch incoming bookings', err);
        setError('Failed to fetch incoming bookings.');
      });

  }, [user, refresh]);

  const updateStatus = async (bookingId, status) => {
    try {
      const res = await fetch(`${apiBaseUrl}/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error('Failed to update booking status:', result.error);
        alert(`Failed to update status: ${result.error || 'Unknown error'}`);
      } else {
        setRefresh(prev => !prev);
      }
    } catch (err) {
      console.error('Network error while updating booking status:', err);
      alert('Network error while updating booking status.');
    }
  };

  return (
    <div className="dashboard" style={{ padding: '2rem' }}>
      <h1>My Bookings</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* --- Metrics bar -------- */}
      <div className="metrics-bar">
        <div className="metric">
          <div className="metric-value">{myBookings.length}</div>
          <div className="metric-label">Active Bookings</div>
        </div>
        {/* repeat metric blocks as needed */}
      </div>

      {/* --- Incoming Booking Requests Table --------------- */}
      {incomingBookings.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2>Incoming Booking Requests</h2>
          <table className="bookings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Space</th>
                <th>Dates</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {incomingBookings.map((booking, index) => (
                <tr key={booking.id}>
                  <td>{String(index + 1).padStart(3, '0')}</td>
                  <td>{booking.Space?.title}</td>
                  <td>{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</td>
                  <td>${booking.price}</td>
                  <td>
                    <span className={`status-badge status-${booking.status}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* --- My Own Bookings Table --------------- */}
      <section>
        <h2>My Booking Requests</h2>
        {myBookings.length === 0 ? (
          <p>You haven't made any bookings.</p>
        ) : (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Space</th>
                <th>Dates</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myBookings.map((booking, index) => (
                <tr key={booking.id}>
                  <td>{String(index + 1).padStart(3, '0')}</td>
                  <td>{booking.Space?.title}</td>
                  <td>{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</td>
                  <td>${booking.price}</td>
                  <td>
                    <span className={`status-badge status-${booking.status}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default BookingDashboard;
