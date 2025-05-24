import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext'; // ✅ import auth context

const SpaceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth(); // ✅ get logged-in user
  const [space, setSpace] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`http://localhost:4000/spaces/${id}`)
      .then(res => res.json())
      .then(data => setSpace(data))
      .catch(err => console.error('Failed to fetch space detail:', err));
  }, [id]);

  const handleBooking = async () => {
    if (!user) {
      setMessage('❌ You must be logged in to book.');
      return;
    }

    const response = await fetch('http://localhost:4000/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate,
        endDate,
        SpaceId: space.id,
        UserId: user.id // ✅ use actual logged-in user ID
      })
    });

    const result = await response.json();
    if (response.ok) {
      setMessage('✅ Booking request submitted!');
    } else {
      setMessage(`❌ Booking failed: ${result.error || 'Unknown error'}`);
    }
  };

  if (!space) return <p>Loading...</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>{space.title}</h1>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Side: Images + Description */}
        <div style={{ flex: 2 }}>
          {space.imageUrls && [...new Set(space.imageUrls)].map((url, i) => (
            <img
              key={i}
              src={url}
              alt={space.title}
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}
            />
          ))}
          <p style={{ whiteSpace: 'pre-line' }}>{space.description}</p>
          <p><strong>Price Per Day:</strong> ${space.price}</p>
          <p><strong>Location:</strong> {space.location}</p>
        </div>

        {/* Right Side: Booking Form */}
        <div style={{
          flex: 1,
          border: '1px solid #ccc',
          padding: '1.5rem',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h2>Book This Space</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <label>
              Start Date:
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </label>
            <button
              onClick={handleBooking}
              style={{
                padding: '0.75rem',
                fontSize: '1rem',
                backgroundColor: '#004aad',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              Submit Booking
            </button>
            {message && <p>{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceDetail;
