// src/pages/LoginInstructor.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginInstructor.module.css';
import API_BASE_URL from '../apiConfig';

export default function LoginInstructor() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/login/instructor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Save token (adjust this if you use a different auth approach)
      localStorage.setItem("instructorId", data.user_id);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('instructorName', data.name);

      // Redirect to instructor dashboard
      navigate(`/instructor-dashboard/${data.user_id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Instructor Login</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />
        <button type="submit" className={styles.button}>Login</button>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    </div>
  );
}
