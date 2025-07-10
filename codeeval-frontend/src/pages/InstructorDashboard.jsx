// src/pages/InstructorDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './InstructorDashboard.module.css';

export default function InstructorDashboard() {
  const [instructorName, setInstructorName] = useState('');
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  

  useEffect(() => {
    if (!token) return navigate('/');

    const fetchClasses = async () => {
      const res = await fetch('http://127.0.0.1:8000/instructor/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClasses(data.classes || []);
    };

    const storedName = localStorage.getItem('instructorName');
    if (storedName) setInstructorName(storedName);

    fetchClasses();
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;

    const res = await fetch('http://127.0.0.1:8000/instructor/class', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newClassName }),
    });

    const data = await res.json();
    setClasses((prev) => [...prev, { id: data.class_id, name: newClassName }]);
    setNewClassName('');
  };

  const handleDelete = async (id) => {
    await fetch(`http://127.0.0.1:8000/instructor/classes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.logo}>CodeEval</span>
        <button className={styles.logout} onClick={handleLogout}>Logout</button>
      </div>
      <h1 className={styles.welcome}>Welcome, {instructorName}</h1>

      <div className={styles.classList}>
        {classes.map((cls) => (
          <div
            key={cls.id}
            className={styles.classBox}
            onClick={() => navigate(`/instructor/${localStorage.getItem('instructorId')}/classes/${cls.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.classInfo}>
              <span>{cls.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent navigation when clicking delete
                  if (window.confirm('Are you sure you want to delete this class?')) {
                    handleDelete(cls.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.newClass}>
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="New class name"
        />
        <button onClick={handleCreateClass}>Add Class</button>
      </div>
    </div>
  );
}
