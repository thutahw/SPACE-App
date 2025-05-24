import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const CreateSpace = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <p style={{padding:'2rem'}}>You must be logged in to list a space.</p>;
  }

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // For MVP: upload images to /public/assets/images and use local URLs
      let imageUrls = [];
      if (images.length > 0) {
        // Simulate upload: copy to /public/assets/images and use relative URLs
        // In real app, use S3 or backend upload endpoint
        imageUrls = Array.from(images).map(f => `/assets/images/${f.name}`);
      }
      const res = await fetch('http://localhost:4000/spaces', {
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
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h2>List Your Own Space</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          Title:
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%' }} />
        </label>
        <label>
          Description:
          <textarea value={description} onChange={e => setDescription(e.target.value)} required style={{ width: '100%' }} />
        </label>
        <label>
          Price per Night ($):
          <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required style={{ width: '100%' }} />
        </label>
        <label>
          Location:
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} required style={{ width: '100%' }} />
        </label>
        <label>
          Images:
          <input type="file" multiple accept="image/*" onChange={handleImageChange} />
        </label>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '0.75rem', backgroundColor: '#004aad', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem' }}>
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
};

export default CreateSpace;
