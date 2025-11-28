// apps/web/src/api/fetchSpaces.js

/*
export const fetchSpaces = async () => {
  const res = await fetch('http://localhost:4000/spaces');
  if (!res.ok) throw new Error('Failed to fetch spaces');
  return res.json();
};
*/

const apiBaseUrl = process.env.REACT_APP_API_URL;

// Accepts optional params: { keyword, location, minPrice, maxPrice }
export const fetchSpaces = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.keyword) query.append('keyword', params.keyword);
  if (params.location) query.append('location', params.location);
  if (params.minPrice) query.append('minPrice', params.minPrice);
  if (params.maxPrice) query.append('maxPrice', params.maxPrice);
  const url = query.toString()
    ? `${apiBaseUrl}/spaces/search?${query.toString()}`
    : `${apiBaseUrl}/spaces`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch spaces');
  return res.json();
};