// src/pages/SpaceDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const SpaceDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const { user } = useAuth();
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

  const handleNext = () => {
    if (!user) {
      setMessage('You must be logged in to book.');
      return;
    }
    if (!startDate || !endDate) {
      setMessage('Please select start and end dates.');
      return;
    }
    history.push({
      pathname: '/booking',
      state: {
        space,
        startDate,
        endDate,
        userId: user.id
      }
    });
  };

  if (!space) return <p>Loading...</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>{space.title}</h1>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Side */}
        <div style={{ flex: 2 }}>
          {space.imageUrls?.map((url, i) => (
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
        {/* Right Side */}
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
              onClick={handleNext}
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
              Proceed to Payment
            </button>
            {message && <p style={{ color: 'red' }}>{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceDetail;
