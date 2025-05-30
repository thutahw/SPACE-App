import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/CreateSpace.css';

// shell example version for CreateSpace page
export default function CreateSpace() {
  const { user } = useAuth();
  const history = useHistory();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = process.env.REACT_APP_API_URL;

  if (!user) {
    return <p style={{ padding: '2rem' }}>You must be logged in to list a space.</p>;
  }

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = Array.from(images).map(f => `/assets/images/${f.name}`);
      }
      const res = await fetch(`${apiBaseUrl}/spaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price,
          location,
          imageUrls,
          ownerId: user.id
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create space');
      } else {
        history.push('/');
      }
    } catch (err) {
      setError('Failed to create space');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="createSpacePage" style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h1 className="pageTitle">List a New Space</h1>
      <form className="formGrid" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="fullWidth">
          <label className="formLabel" htmlFor="title">Title</label>
          <input id="title" className="formInput" type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div>
          <label className="formLabel" htmlFor="dailyPrice">Price / day</label>
          <input id="dailyPrice" type="number" className="formInput" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div>
          <label className="formLabel" htmlFor="city">City</label>
          <input id="city" className="formInput" type="text" value={location} onChange={e => setLocation(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div className="fullWidth">
          <label className="formLabel" htmlFor="description">Description</label>
          <textarea id="description" rows="4" className="formTextarea" value={description} onChange={e => setDescription(e.target.value)} required style={{ width: '100%' }}></textarea>
        </div>
        <div className="fullWidth">
          <label className="formLabel" htmlFor="images">Images</label>
          <input id="images" type="file" multiple accept="image/*" onChange={handleImageChange} />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" className="submitBtn" disabled={loading} style={{ padding: '0.75rem', backgroundColor: '#004aad', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem' }}>
          {loading ? 'Creating...' : 'Publish space'}
        </button>
      </form>
    </section>
  );
}
