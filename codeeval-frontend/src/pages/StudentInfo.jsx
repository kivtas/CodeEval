import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './StudentInfo.module.css';

export default function StudentInfo() {
  const { instructorId, classId, studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return navigate('/');

    const fetchStudent = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/instructor/classes/${classId}/students`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to load student list');

        const studentData = data.students.find(s => String(s.id) === studentId);
        if (!studentData) throw new Error("Student not found in this class");

        setStudent(studentData);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchStudent();
  }, [token, classId, studentId, navigate]);

  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!student) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
      <h1>Student Info</h1>
      <p><strong>Name:</strong> {student.name}</p>
      <p><strong>Username:</strong> {student.username}</p>
      <p><strong>Login Code:</strong> {student.raw_password}</p>
    </div>
  );
}
