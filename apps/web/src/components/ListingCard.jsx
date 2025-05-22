import React from 'react';
import { Link } from 'react-router-dom';

const ListingCard = ({ space }) => {
  // imageUrls가 string이면 JSON.parse, 배열이면 그대로 사용
  const parsedImageUrls =
    typeof space.imageUrls === 'string'
      ? JSON.parse(space.imageUrls)
      : space.imageUrls || [];

  return (
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
          boxSizing: 'border-box',
          borderRadius: '8px',
          backgroundColor: '#fff',
        }}
      >
        {/* Title */}
        <h2
          style={{
            margin: '0 0 0.5rem 0',
            minHeight: '3.5rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.2',
            fontSize: '1.25rem'
          }}
        >
          {space.title}
        </h2>

        {/* Image */}
        {parsedImageUrls.length > 0 && (
          <img
            src={parsedImageUrls[0]}
            alt={space.title}
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '0.75rem',
            }}
          />
        )}

        {/* Description & Meta */}
        <div style={{ flexGrow: 1 }}>
          <p style={{ minHeight: '3.5rem', marginBottom: '0.5rem' }}>
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
};

export default ListingCard;
