import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './StudentSubmissionDetails.module.css';
import API_BASE_URL from '../apiConfig';

export default function StudentSubmissionDetails() {
  const { assignmentId, studentId, classId } = useParams();
  const token = localStorage.getItem('token');

  const [studentName, setStudentName] = useState('');
  const [code, setCode] = useState('');
  const [grade, setGrade] = useState('');
  const [testResults, setTestResults] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [submittedAt, setSubmittedAt] = useState('');

  useEffect(() => {
    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    const res = await fetch(`${API_BASE_URL}/instructor/assignments/${assignmentId}/submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const studentSub = data.submissions.find(sub => sub.student_id === parseInt(studentId));
    if (studentSub) {
      setStudentName(studentSub.student_name);
      setCode(studentSub.code);
      setGrade(studentSub.grade);
      setTestResults(studentSub.test_results);
      setSubmittedAt(studentSub.submitted_at);
    }
  };

  const handleSaveGrade = async () => {
    setIsSaving(true);
    await fetch(`${API_BASE_URL}/instructor/assignments/${assignmentId}/submissions/${studentId}/grade`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ grade })
    });
    alert('Grade updated');
    setIsSaving(false);
  };

  return (
    <div className={styles.container}>
      <h1>{studentName}'s Submission</h1>

      <h3>Submitted Code:</h3>
      <pre className={styles.codeBox}>{code}</pre>

      <h3>Test Results:</h3>
      <pre className={styles.resultsBox}>{testResults}</pre>

      <p><strong>Submitted At:</strong> {submittedAt}</p>

      <div className={styles.gradeSection}>
        <label>
          Grade:
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className={styles.gradeInput}
          />
        </label>
        <button onClick={handleSaveGrade} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Grade'}
        </button>
      </div>
    </div>
  );
}
