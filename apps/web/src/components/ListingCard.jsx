import React from 'react';
import { Link } from 'react-router-dom';

const ListingCard = ({ space }) => (
  <Link to={`/spaces/${space.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
    <div
      style={{
        border: '1px solid #ccc',
        padding: '1rem',
        width: '300px',
        minHeight: '550px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
      }}
    >
      <h2
        style={{
          margin: '0 0 0.5rem 0',
          minHeight: '3.5rem', // roughly fits 2 lines
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {space.title}
      </h2>


      {space.imageUrls && [...new Set(space.imageUrls)].map((url, i) => (
        <img
          key={i}
          src={url}
          alt={space.title}
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '0.5rem'
          }}
        />
      ))}

      {/* Content wrapper for text */}
      <div style={{ flexGrow: 1 }}>
        <p style={{ minHeight: '3.5rem' }}>
          {space.description.length > 80
            ? space.description.slice(0, 77) + '...'
            : space.description}
        </p>
        <p style={{ margin: '0 0 0.25rem 0' }}>
          <strong>Price Per Day:</strong> ${space.price}
        </p>
        <p style={{ margin: 0 }}>
          <strong>Location:</strong> {space.location}
        </p>
      </div>
    </div>
  </Link>
);

export default ListingCard;
