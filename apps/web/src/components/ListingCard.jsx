// apps/web/src/components/ListingCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ListingCard = ({ space }) => (
  <Link to={`/spaces/${space.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
    <div style={{ border: '1px solid #ccc', padding: '1rem', width: '300px' }}>
      <h2>{space.title}</h2>
      <p>{space.description}</p>
      <p><strong>Price Per Day:</strong> ${space.price}</p>
      <p><strong>Location:</strong> {space.location}</p>
      {space.imageUrls?.map((url, i) => (
        <img key={i} src={url} alt="space" style={{ width: '100%', marginTop: '0.5rem' }} />
      ))}
    </div>
  </Link>
);

export default ListingCard;
