import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { fetchSpaces } from '../api/fetchSpaces';
import ListingCard from '../components/ListingCard';
import { useAuth } from '../auth/AuthContext';

const Spaces = () => {
  const [spaces, setSpaces] = useState([]);
  const history = useHistory();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchSpaces()
      .then(data => setSpaces(data))
      .catch(err => console.error("Failed to fetch spaces:", err));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1>Available Spaces</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && <span> Hello, <strong> {user.name || user.email}</strong></span>}
          {user && (
            <button
              onClick={() => history.push('/bookings')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'green',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              My Bookings
            </button>
          )}
          <button
            onClick={() => {
              if (user) {
                logout();
              } else {
                history.push('/login');
              }
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: user ? '#888' : '#004aad',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {user ? 'Logout' : 'Login'}
          </button>
        </div>
      </div>

      <p>Spaces loaded: {spaces.length}</p>

      {spaces.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {spaces.map(space => (
            <ListingCard key={space.id} space={space} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Spaces;
