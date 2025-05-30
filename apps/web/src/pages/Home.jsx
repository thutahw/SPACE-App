import React, { useEffect, useState } from 'react';
import { fetchSpaces } from '../api/fetchSpaces';
import ListingCard from '../components/ListingCard';
import '../styles/home.css';

export default function Home() {
  const [spaces, setSpaces] = useState([]);

  useEffect(() => {
    fetchSpaces()
      .then(data => setSpaces(data))
      .catch(err => console.error('Error loading spaces:', err));
  }, []);

  return (
    <main className="homePage">
      <h1 className="heroTitle">Discover local spaces for your ads</h1>
      <p className="heroSubtitle">
        List unused surfaces or find the perfect hyper-local spot to reach your audience.
      </p>
      <button className="ctaBtn" onClick={() => window.location.href = '/spaces'}>
        Explore Spaces
      </button>
    </main>
  );
}
