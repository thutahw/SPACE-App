import React, { useEffect, useState } from 'react';
import { fetchSpaces } from '../api/fetchSpaces';
import ListingCard from '../components/ListingCard';

import '../styles/Spaces.css';   // 새로 만든 스타일

const Spaces = () => {
  const [spaces, setSpaces] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', location: '', minPrice: '', maxPrice: '' });
  const [loading, setLoading] = useState(false);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const handleSearch = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const filtered = await fetchSpaces({
        keyword: filters.keyword,
        location: filters.location,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      });
      setSpaces(filtered);
    } catch (err) {
      console.error('Failed to fetch spaces:', err);
      setSpaces([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchSpaces()
      .then(setSpaces)
      .catch(err => console.error('Failed to fetch spaces:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="spaces-container">
      <h1 className="spaces-title">Available Spaces</h1>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          name="keyword"
          placeholder="Search by title..."
          value={filters.keyword}
          onChange={handleInputChange}
          style={{ padding: 8, minWidth: 180 }}
        />
        <input
          type="text"
          name="location"
          placeholder="Location..."
          value={filters.location}
          onChange={handleInputChange}
          style={{ padding: 8, minWidth: 140 }}
        />
        <input
          type="number"
          name="minPrice"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={handleInputChange}
          style={{ padding: 8, width: 100 }}
          min="0"
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={handleInputChange}
          style={{ padding: 8, width: 100 }}
          min="0"
        />
        <button type="submit" style={{ padding: '8px 18px', background: '#004aad', color: '#fff', border: 'none', borderRadius: 4 }}>
          Search
        </button>
      </form>
      <p className="spaces-count">Spaces loaded: {spaces.length}</p>
      {loading ? (
        <p>Loading...</p>
      ) : spaces.length === 0 ? (
        <p>No listings found.</p>
      ) : (
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