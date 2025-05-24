// apps/web/src/api/fetchSpaces.js
export const fetchSpaces = async () => {
  const res = await fetch('http://localhost:4000/spaces');
  if (!res.ok) throw new Error('Failed to fetch spaces');
  return res.json();
};
