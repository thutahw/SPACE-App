import React, { useEffect, useState } from 'react';
import { fetchSpaces } from '../api/fetchSpaces';
import ListingCard from '../components/ListingCard';

const Home = () => {
  const [spaces, setSpaces] = useState([]);

  useEffect(() => {
    fetchSpaces()
      .then(data => setSpaces(data))
      .catch(err => console.error('Error loading spaces:', err));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Available Ad Spaces</h1>
      <p>Total Listings: {spaces.length}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {spaces.map(space => (
          <ListingCard key={space.id} space={space} />
        ))}
      </div>
    </div>
  );
};

export default Home;
