import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { fetchSpaces } from '../api/fetchSpaces';
import ListingCard      from '../components/ListingCard';
import { useAuth }      from '../auth/AuthContext';

import '../styles/Home.css';        // <── new landing-page styles

/**
 * Public “Available Spaces” landing page.
 * - Shows inventory to anyone.
 * - When the user is logged-in, quick-action buttons appear.
 */
const Spaces = () => {
  const [spaces, setSpaces] = useState([]);
  const history             = useHistory();
  const { user }            = useAuth();   // we only READ user here now

  /* fetch inventory once on mount */
  useEffect(() => {
    fetchSpaces()
      .then(setSpaces)
      .catch(err => console.error('Failed to fetch spaces:', err));
  }, []);

  return (
    <main className="home-container">
      {/* ──────────────── Header */}
      <header className="home-header">
        <h1 className="home-title">Available Spaces</h1>

        {user && (
          <div className="home-actions">
            <span className="welcome-text">
              Hello,&nbsp;<strong>{user.name || user.email}</strong>
            </span>

            <button
              className="button button-green"
              onClick={() => history.push('/bookings')}
            >
              My Bookings
            </button>

            <button
              className="button button-blue"
              onClick={() => history.push('/create-space')}
            >
              List your own space
            </button>

            <button
              className="button button-blue"
              onClick={() => history.push('/my-spaces')}
            >
              View your spaces
            </button>
          </div>
        )}
      </header>

      {/* ──────────────── Inventory */}
      <p className="space-count">Spaces loaded: {spaces.length}</p>

      {spaces.length === 0 ? (
        <p className="no-listing">No listings found.</p>
      ) : (
        <section className="listing-grid">
          {spaces.map(space => (
            <ListingCard key={space.id} space={space} />
          ))}
        </section>
      )}
    </main>
  );
};

export default Spaces;