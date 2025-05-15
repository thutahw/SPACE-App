import React from 'react';
import { useParams } from 'react-router-dom';

const SpaceDetail = () => {
  const { id } = useParams();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Space Detail Page</h1>
      <p>Selected space ID: {id}</p>
      {/* Later: Fetch & display full info based on `id` */}
    </div>
  );
};

export default SpaceDetail;
