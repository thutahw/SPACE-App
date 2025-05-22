import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useHistory } from 'react-router-dom';

const MySpaces = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [spaces, setSpaces] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetch('http://localhost:4000/spaces')
        .then(res => res.json())
        .then(data => setSpaces(data.filter(s => s.ownerId === user.id)))
        .catch(() => setError('Failed to load your spaces.'));
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this space?')) return;
    setLoading(true);
    await fetch(`http://localhost:4000/spaces/${id}`, { method: 'DELETE' });
    setSpaces(spaces.filter(s => s.id !== id));
    setLoading(false);
  };

  const startEdit = (space) => {
    setEditingId(space.id);
    setEditData({
      title: space.title,
      description: space.description,
      price: space.price,
      location: space.location,
      imageUrls: space.imageUrls || [],
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleEditSave = async (id) => {
    setLoading(true);
    const res = await fetch(`http://localhost:4000/spaces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    });
    if (res.ok) {
      const updated = await res.json();
      setSpaces(spaces.map(s => (s.id === id ? updated : s)));
      setEditingId(null);
    } else {
      setError('Failed to update space.');
    }
    setLoading(false);
  };

  if (!user) return <p style={{padding:'2rem'}}>You must be logged in to view your spaces.</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Your Space Listings</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {spaces.length === 0 ? (
        <p>You have not listed any spaces yet.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'flex-start' }}>
          {spaces.map(space => (
            <div key={space.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, width: 300, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {editingId === space.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input name="title" value={editData.title} onChange={handleEditChange} style={{ fontWeight: 'bold', fontSize: 18 }} />
                  <textarea name="description" value={editData.description} onChange={handleEditChange} style={{ minHeight: 60 }} />
                  <input name="price" type="number" value={editData.price} onChange={handleEditChange} />
                  <input name="location" value={editData.location} onChange={handleEditChange} />
                  <button onClick={() => handleEditSave(space.id)} disabled={loading} style={{ background: '#004aad', color: '#fff', border: 'none', borderRadius: 4, padding: 8, marginTop: 8 }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 4, padding: 8 }}>Cancel</button>
                </div>
              ) : (
                <>
                  <h3>{space.title}</h3>
                  {space.imageUrls && space.imageUrls.length > 0 && (
                    <img src={space.imageUrls[0]} alt={space.title} style={{ width: '100%', borderRadius: 6, marginBottom: 8 }} />
                  )}
                  <p style={{ minHeight: '3.5rem', marginBottom: '0.5rem', whiteSpace: 'pre-line' }}>
                    {space.description && space.description.length > 180 && !space._showFull ? (
                      <>
                        {space.description.slice(0, 180)}... <button style={{ color: '#004aad', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setSpaces(spaces.map(s => s.id === space.id ? { ...s, _showFull: true } : s))}>See more</button>
                      </>
                    ) : (
                      <>
                        {space.description}
                        {space.description && space.description.length > 180 && (
                          <button style={{ color: '#004aad', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setSpaces(spaces.map(s => s.id === space.id ? { ...s, _showFull: false } : s))}>See less</button>
                        )}
                      </>
                    )}
                  </p>
                  <p><strong>Price:</strong> ${space.price}</p>
                  <p><strong>Location:</strong> {space.location}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => startEdit(space)} style={{ background: '#004aad', color: '#fff', border: 'none', borderRadius: 4, padding: 8 }}>Edit</button>
                    <button onClick={() => handleDelete(space.id)} style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: 8 }}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySpaces;
