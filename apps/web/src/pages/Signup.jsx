import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Signup = () => {
  const { login } = useAuth();
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  const apiBaseUrl = process.env.REACT_APP_API_URL; // ✅ 환경변수로 API 주소 관리

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${apiBaseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
      } else {
        login(data);
        history.push('/');
      }
    } catch (err) {
      setError('Signup failed');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        />

        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        />

        <label>Role:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Signup;



// import React, { useState } from 'react';
// import { useHistory } from 'react-router-dom';
// import { useAuth } from '../auth/AuthContext';

// const Signup = () => {
//   const { login } = useAuth();
//   const history = useHistory();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [role, setRole] = useState('user');
//   const [error, setError] = useState('');

//   const handleSignup = async (e) => {
//     e.preventDefault();

//     try {
//       const res = await fetch('http://localhost:4000/users', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, role })
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         setError(data.error || 'Signup failed');
//       } else {
//         login(data);
//         history.push('/');
//       }
//     } catch (err) {
//       setError('Signup failed');
//     }
//   };

//   return (
//     <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
//       <h2>Sign Up</h2>
//       <form onSubmit={handleSignup}>
//         <label>Email:</label>
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           style={{ width: '100%', marginBottom: '1rem' }}
//         />

//         <label>Password:</label>
//         <input
//           type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           style={{ width: '100%', marginBottom: '1rem' }}
//         />

//         <label>Role:</label>
//         <select
//           value={role}
//           onChange={(e) => setRole(e.target.value)}
//           style={{ width: '100%', marginBottom: '1rem' }}
//         >
//           <option value="user">User</option>
//           <option value="admin">Admin</option>
//         </select>

//         {error && <p style={{ color: 'red' }}>{error}</p>}

//         <button type="submit" style={{ padding: '0.5rem 1rem' }}>
//           Sign Up
//         </button>
//       </form>
//     </div>
//   );
// };

// export default Signup;
