import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './StudentDashboard.module.css';
import API_BASE_URL from '../apiConfig';

export default function StudentDashboard() {
  const { studentId } = useParams();
  const token = localStorage.getItem('token');
  const studentName = localStorage.getItem('studentName');
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    if (!token) return navigate('/');

    const fetchAssignments = async () => {
      const res = await fetch(`${API_BASE_URL}/student/${studentId}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAssignments(data.assignments || []);
    };

    fetchAssignments();
  }, [studentId, token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleAssignmentClick = (assignmentId) => {
    navigate(`/student/${studentId}/assignments/${assignmentId}`);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.logo}>CodeEval</span>
        <button className={styles.logout} onClick={handleLogout}>Logout</button>
      </header>

      <h1 className={styles.welcome}>Welcome, {studentName}</h1>

      <div className={styles.assignmentGrid}>
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className={styles.assignmentBox}
            onClick={() => handleAssignmentClick(assignment.id)}
            style={{ cursor: 'pointer' }}
          >
            <h3>{assignment.title}</h3>
            <p>Due: {assignment.due_date?.split('T')[0]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
