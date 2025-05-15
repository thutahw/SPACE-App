// apps/web/src/pages/Spaces.jsx
import React, { useEffect, useState } from 'react';
import { fetchSpaces } from '../api/fetchSpaces';
import ListingCard from '../components/ListingCard';

const Spaces = () => {
  const [spaces, setSpaces] = useState([]);

  useEffect(() => {
    fetchSpaces()
      .then(data => setSpaces(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Available Spaces</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {spaces.map(space => (
          <ListingCard key={space.id} space={space} />
        ))}
      </div>
    </div>
  );
};

export default Spaces;
