import React, { useEffect, useState } from 'react';
import { fetchSpaces } from '../api/fetchSpaces';
import ListingCard from '../components/ListingCard';

import '../styles/Spaces.css';   // 새로 만든 스타일

const Spaces = () => {
  const [spaces, setSpaces] = useState([]);

  useEffect(() => {
    fetchSpaces()
      .then(setSpaces)
      .catch(err => console.error('Failed to fetch spaces:', err));
  }, []);

  return (
    <main className="spaces-container">
      <h1 className="spaces-title">Available Spaces</h1>
      <p className="spaces-count">Spaces loaded: {spaces.length}</p>

      {spaces.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        // 카드 영역
        <div className="listing-grid">
          {spaces.map(space => (
            <ListingCard key={space.id} space={space} />
          ))}
        </div>
      )}
    </main>
  );
};

export default Spaces;