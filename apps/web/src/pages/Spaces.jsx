import React, { useEffect, useState } from 'react';
import { fetchSpaces } from '../api/fetchSpaces';
import ListingCard from '../components/ListingCard';

const Spaces = () => {
  const [spaces, setSpaces] = useState([]);

  useEffect(() => {
    fetchSpaces()
      .then(data => {
        console.log("Fetched spaces:", data); // ✅ Check browser console
        setSpaces(data);
      })
      .catch(err => {
        console.error("Failed to fetch spaces:", err);
      });
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Available Spaces</h1>
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
