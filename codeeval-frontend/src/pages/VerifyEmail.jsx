// src/pages/VerifyEmail.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './VerifyEmail.module.css';

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
        const res = await fetch(`http://127.0.0.1:8000/verify-email?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || 'Verification failed.');
        }

        // Example: "Email satvik@example.com has been verified."
        const email = data.message.split(' ')[1];
        setMessage('Email verified successfully! Redirecting to password setup...');

        setTimeout(() => {
          navigate(`/set-password?email=${email}`);
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
