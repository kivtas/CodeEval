import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './StudentLogin.module.css';
import API_BASE_URL from '../apiConfig';

export default function StudentLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/login/student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (Array.isArray(data.detail)) {
          setError(data.detail.map((e) => e.msg).join(', '));
        } else {
          setError(data.detail || 'Login failed');
        }
        return;
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('studentId', data.user_id);
      localStorage.setItem('studentName', data.name);
      navigate(`/student/${data.user_id}/dashboard`);
    } catch (err) {
      setError('Network error or server unreachable');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Student Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
