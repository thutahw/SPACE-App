import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const BookingDashboard = () => {
  const { user } = useAuth();
  const [userBookings, setUserBookings] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [userRes, ownerRes] = await Promise.all([
          fetch(`http://localhost:4000/bookings/user/${user.id}`),
          fetch(`http://localhost:4000/bookings/owner/${user.id}`)
        ]);

        const userData = await userRes.json();
        const ownerData = await ownerRes.json();

        setUserBookings(userData || []);
        setOwnerBookings(ownerData || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return <p>You must be logged in to view your bookings.</p>;
  if (loading) return <p>Loading bookings...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Your Booking Dashboard</h1>

      {/* Bookings Made by the User */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Bookings You Made</h2>
        {userBookings.length === 0 ? (
          <p>You haven’t made any bookings yet.</p>
        ) : (
          <ul>
            {userBookings.map(booking => (
              <li key={booking.id} style={{ marginBottom: '1rem' }}>
                <strong>{booking.Space?.title}</strong><br />
                {booking.startDate} → {booking.endDate} <br />
                Status: <strong>{booking.status}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bookings to the User’s Owned Spaces */}
      {ownerBookings.length > 0 && (
        <section style={{ marginTop: '3rem' }}>
          <h2>Incoming Bookings for Your Spaces</h2>
          <ul>
            {ownerBookings.map(booking => (
              <li key={booking.id} style={{ marginBottom: '1rem' }}>
                <strong>{booking.Space?.title}</strong><br />
                Booked by: {booking.User?.email} <br />
                {booking.startDate} → {booking.endDate} <br />
                Status: <strong>{booking.status}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default BookingDashboard;
