// src/pages/BookingDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const BookingDashboard = () => {
  const { user } = useAuth();
  const [myBookings, setMyBookings] = useState([]);
  const [incomingBookings, setIncomingBookings] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    // Fetch bookings made by this user
    fetch(`http://localhost:4000/bookings/user/${user.id}`)
      .then(res => res.json())
      .then(data => setMyBookings(data))
      .catch(err => {
        console.error('Failed to fetch my bookings', err);
        setError('Failed to fetch your bookings.');
      });

    // Fetch bookings received by this user if they are a space owner
    fetch(`http://localhost:4000/bookings/owner/${user.id}`)
      .then(res => res.json())
      .then(data => setIncomingBookings(data))
      .catch(err => {
        console.error('Failed to fetch incoming bookings', err);
        setError('Failed to fetch incoming bookings.');
      });

  }, [user, refresh]);

  const updateStatus = async (bookingId, status) => {
    try {
      const res = await fetch(`http://localhost:4000/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error('Failed to update booking status:', result.error);
        alert(`Failed to update status: ${result.error || 'Unknown error'}`);
      } else {
        setRefresh(prev => !prev); // trigger re-fetch
      }
    } catch (err) {
      console.error('Network error while updating booking status:', err);
      alert('Network error while updating booking status.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Booking Dashboard</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Incoming Bookings (if this user owns spaces) */}
      {incomingBookings.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2>Incoming Booking Requests</h2>
          <ul>
            {incomingBookings.map(booking => (
              <li key={booking.id} style={{ marginBottom: '1rem' }}>
                <strong>{booking.Space?.title}</strong> — {booking.startDate} to {booking.endDate}<br />
                Requested by: {booking.User?.email}<br />
                Status: <strong>{booking.status}</strong>
                {booking.message && (
                  <p><strong>Message:</strong> {booking.message}</p>
                )}
                {booking.status === 'pending' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      onClick={() => updateStatus(booking.id, 'confirmed')}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(booking.id, 'rejected')}
                      style={{ color: 'red' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* My Own Bookings */}
      <section>
        <h2>My Booking Requests</h2>
        {myBookings.length === 0 ? (
          <p>You haven't made any bookings.</p>
        ) : (
          <ul>
            {myBookings.map(booking => (
              <li key={booking.id} style={{ marginBottom: '1rem' }}>
                <strong>{booking.Space?.title}</strong> — {booking.startDate} to {booking.endDate}<br />
                Status: <strong>{booking.status}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default BookingDashboard;
