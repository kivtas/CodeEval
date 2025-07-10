import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './AssignmentSubmission.module.css';
import Editor from '@monaco-editor/react';

export default function AssignmentSubmission() {
  const { assignmentId, studentId } = useParams();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [code, setCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [testCases, setTestCases] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return navigate('/');
    fetchAssignmentDetails();
    fetchPublicTestCases();
  }, [assignmentId, token, navigate]);

  const fetchAssignmentDetails = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/student/${studentId}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const data = await res.json();
      const assignmentDetails = data.assignments?.find(a => a.id === parseInt(assignmentId));
      if (assignmentDetails) {
        setAssignment(assignmentDetails);
        setCode(assignmentDetails.starter_code || '');
      }
    } catch (err) {
      console.error('Failed to fetch assignment details:', err);
    }
  };

  const fetchPublicTestCases = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/student/assignments/${assignmentId}/test-cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const data = await res.json();
      setTestCases(data.test_cases || []);
    } catch (err) {
      console.error('Failed to fetch test cases:', err);
    }
  };

  const handleRun = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
  
      const data = await res.json();
      const output = data.stdout || '';
      const error = data.stderr || '';
  
      setConsoleOutput(
        output + (error ? `\n\nError:\n${error}` : '') || 'No output'
      );
    } catch {
      setConsoleOutput('Error running code');
    }
  };
  

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignment_id: assignmentId, code }),
      });

      const result = await res.json();
      setConsoleOutput(`Submitted! Passed: ${result.passed}\n\nResults:\n${JSON.stringify(result.results, null, 2)}`);
    } catch {
      setConsoleOutput('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(`/student/${studentId}/dashboard`)}>
          ← Back
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.editorPanel}>
          <Editor
            height="400px"
            language="python"
            value={code}
            onChange={(value) => setCode(value)}
            theme="vs-light"
          />
          <div className={styles.controls}>
            <button onClick={handleRun}>Run</button>
            <button onClick={handleSubmit} disabled={submitting}>Submit</button>
          </div>
          <pre className={styles.console}>{consoleOutput}</pre>
        </div>

        <div className={styles.infoPanel}>
          <h2>{assignment?.title}</h2>
          <p>{assignment?.description}</p>
          {testCases.length > 0 && (
            <>
              <h3>Public Test Cases</h3>
              <ul>
                {testCases.map((tc, i) => (
                  <li key={i}>
                    <strong>{tc.target_function}</strong>({JSON.stringify(tc.input)}) → {JSON.stringify(tc.expected_output)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
