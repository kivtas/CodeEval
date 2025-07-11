// src/pages/VerifyEmail.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './VerifyEmail.module.css';
import API_BASE_URL from '../apiConfig';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('No token found in the URL.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/verify-email?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || 'Verification failed.');
        }

        const email = data.email;
        setMessage('Email verified successfully! Redirecting to password setup...');

        setTimeout(() => {
          navigate(`/set-password?email=${encodeURIComponent(email)}`);
        }, 2000);
      } catch (err) {
        setError(err.message);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {error ? `Error: ${error}` : message}
      </h1>
    </div>
  );
}