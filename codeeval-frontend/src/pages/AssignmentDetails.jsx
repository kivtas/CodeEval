import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './AssignmentDetails.module.css';
import AddTestCaseModal from '../components/AddTestCaseModal';
import Editor from '@monaco-editor/react';
import API_BASE_URL from '../apiConfig';

export default function AssignmentDetails() {
  const { classId, assignmentId, instructorId } = useParams();
  const token = localStorage.getItem('token');

  const [starterCode, setStarterCode] = useState('');
  const [runOutput, setRunOutput] = useState('');
  const [students, setStudents] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchStarterCode();
    fetchStudents();
    fetchTestCases();
  }, [assignmentId]);

  const fetchStarterCode = async () => {
    const res = await fetch(`${API_BASE_URL}/instructor/classes/${classId}/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const assignment = data.assignments.find(a => a.id === parseInt(assignmentId));
    if (assignment) setStarterCode(assignment.starter_code || '');
  };

  const fetchStudents = async () => {
    const res = await fetch(`${API_BASE_URL}/instructor/assignments/${assignmentId}/submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setStudents(data.submissions || []);
  };

  const fetchTestCases = async () => {
    const res = await fetch(`${API_BASE_URL}/instructor/assignments/${assignmentId}/test-cases`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setTestCases(data.test_cases || []);
  };

  const handleRun = async () => {
    const res = await fetch(`${API_BASE_URL}/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: starterCode }),
    });
    const data = await res.json();
    setRunOutput(data.stdout || data.stderr || data.error || 'No output.');
  };

  const handleSave = async () => {
    await fetch(`${API_BASE_URL}/instructor/assignments/${assignmentId}/starter-code`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ starter_code: starterCode }),
    });
    alert('Starter code saved.');
  };

  const handleDeleteTestCase = async (testCaseId) => {
    if (!window.confirm('Delete this test case?')) return;
    await fetch(`${API_BASE_URL}/instructor/test-cases/${testCaseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTestCases(); // refresh list
  };

  const openStudentTab = (studentId) => {
    const url = `/instructor/${instructorId}/classes/${classId}/assignments/${assignmentId}/students/${studentId}`;
    window.open(url, '_blank');
  };

  const groupedTestCases = testCases.reduce((acc, test) => {
    if (!acc[test.target_function]) acc[test.target_function] = [];
    acc[test.target_function].push(test);
    return acc;
  }, {});

  return (
    <div className={styles.pageLayout}>
      {/* LEFT COLUMN */}
      <aside className={styles.leftColumn}>
        <h3>Students</h3>
        <div className={styles.studentList}>
          {students.map(sub => (
            <div
              key={sub.student_id}
              className={styles.studentItem}
              onClick={() => openStudentTab(sub.student_id)}
            >
              {sub.student_name}
            </div>
          ))}
        </div>
      </aside>

      {/* CENTER PANEL */}
      <main className={styles.editorPanel}>
        <h2>Starter Code</h2>

        <Editor
          height="400px"
          language="python"
          value={starterCode}
          onChange={(value) => setStarterCode(value || '')}
          theme="vs-light"
        />

        <div className={styles.buttonRow}>
          <button onClick={handleRun}>Run</button>
          <button onClick={handleSave}>Save</button>
        </div>

        <div className={styles.console}>
          <h4>Console Output:</h4>
          <pre>{runOutput}</pre>
        </div>
      </main>

      {/* RIGHT COLUMN */}
      <aside className={styles.rightColumn}>
        <h3>Test Cases</h3>
        <button onClick={() => setShowModal(true)} className={styles.addTestCaseButton}>
          + Add Test Case
        </button>
        <div className={styles.testCaseList}>
          {Object.entries(groupedTestCases).map(([func, cases]) => (
            <div key={func} className={styles.testGroup}>
              <h4>{func}</h4>
              {cases.map(test => (
                <div key={test.id} className={styles.testItem}>
                  <div><strong>Input:</strong> {JSON.stringify(test.input)}</div>
                  <div><strong>Expected:</strong> {JSON.stringify(test.expected_output)}</div>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteTestCase(test.id)}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {showModal && (
        <AddTestCaseModal
          assignmentId={assignmentId}
          token={token}
          onClose={() => setShowModal(false)}
          onSuccess={fetchTestCases}
        />
      )}
    </div>
  );
}
