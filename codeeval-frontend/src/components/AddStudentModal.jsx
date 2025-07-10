// src/components/AddStudentModal.jsx
import { useState } from 'react';
import styles from './AddStudentModal.module.css';

export default function AddStudentModal({ onClose, onAdd, classId }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStudentInfo(null);

    try {
      const res = await fetch(`http://127.0.0.1:8000/instructor/classes/${classId}/add-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add student');

      setStudentInfo({ username: data.username, password: data.password });
      onAdd(); // refresh student list
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Add Student</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <button type="submit">Add</button>
          <button type="button" onClick={onClose} className={styles.cancel}>Cancel</button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
        {studentInfo && (
          <div className={styles.success}>
            <p>Student added!</p>
            <p><strong>Username:</strong> {studentInfo.username}</p>
            <p><strong>Password:</strong> {studentInfo.password}</p>
          </div>
        )}
      </div>
    </div>
  );
}