import { useState } from 'react';
import styles from './AddTestCaseModal.module.css';
import API_BASE_URL from '../apiConfig';

export default function AddTestCaseModal({ assignmentId, token, onClose, onSuccess }) {
  const [targetFunction, setTargetFunction] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [isPublic, setIsPublic] = useState(false); // new state

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/instructor/assignments/${assignmentId}/test-cases`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_function: targetFunction,
          input: JSON.parse(inputValue),
          expected_output: JSON.parse(expectedOutput),
          public: isPublic, // required by backend
        }),
      });

      if (res.ok) {
        onSuccess(); // refresh list
        onClose();   // close modal
      } else {
        alert('Failed to add test case');
      }
    } catch (err) {
      alert('Invalid JSON input or output');
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Add Test Case</h3>
        <label>
          Target Function:
          <input
            value={targetFunction}
            onChange={(e) => setTargetFunction(e.target.value)}
          />
        </label>
        <label>
          Input (JSON):
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder='e.g. ["hello"] or [3, 4]'
          />
        </label>
        <label>
          Expected Output (JSON):
          <input
            value={expectedOutput}
            onChange={(e) => setExpectedOutput(e.target.value)}
            placeholder='e.g. "olleh" or 7'
          />
        </label>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public (students can see this)
        </label>
        <div className={styles.modalButtons}>
          <button onClick={handleSubmit}>Add</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
