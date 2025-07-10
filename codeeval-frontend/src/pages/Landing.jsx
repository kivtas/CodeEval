import styles from './Landing.module.css';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to CodeEval</h1>
      <div className={styles.buttonGroup}>
        <button className={styles.button} onClick={() => navigate('/login/instructor')}>
          Instructor Login
        </button>
        <button className={styles.button} onClick={() => navigate('/login/student')}>
          Student Login
        </button>
        <button className={styles.button} onClick={() => navigate('/register')}>
          Register
        </button>
      </div>
    </div>
  );
}
