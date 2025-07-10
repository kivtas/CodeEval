import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ClassDashboard.module.css';
import AddStudentModal from '../components/AddStudentModal.jsx';
import CreateAssignmentModal from '../components/CreateAssignmentModal.jsx';

export default function ClassDashboard() {
  const { instructorId, classId } = useParams();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  

  useEffect(() => {
    if (!token) return navigate('/');
    console.log("Fetching students and assignments for classId:", classId);
    fetchStudents();
    fetchAssignments();
  }, [classId, token, navigate]);

  const fetchStudents = async () => {
    console.log("Fetching students from:", `http://127.0.0.1:8000/instructor/classes/${classId}/students`);
    const res = await fetch(`http://127.0.0.1:8000/instructor/classes/${classId}/students`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log("Fetched students:", data.students);
    setStudents(data.students || []);
  };

  const fetchAssignments = async () => {
    console.log("Fetching assignments from:", `http://127.0.0.1:8000/instructor/classes/${classId}/assignments`);
    const res = await fetch(`http://127.0.0.1:8000/instructor/classes/${classId}/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log("Fetched assignments:", data.assignments);
    setAssignments(data.assignments || []);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove this student?")) return;
    await fetch(`http://127.0.0.1:8000/instructor/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    await fetch(`http://127.0.0.1:8000/instructor/assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <span className={styles.logo} onClick={() => navigate('/')}>CodeEval</span>
        <button className={styles.logout} onClick={handleLogout}>Logout</button>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Students</h2>
            <button className={styles.addButton} onClick={() => setShowStudentModal(true)}>+ Add Student</button>
          </div>

          <div className={styles.studentList}>
            {students.map(student => (
              <div key={student.id} className={styles.studentItem}>
                <span
                  onClick={() => {
                    console.log("Navigating to student info:", {
                      instructorId,
                      classId,
                      studentId: student.id
                    });
                    navigate(`/instructor/${instructorId}/classes/${classId}/students/${student.id}`);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {student.username}
                </span>
                <button onClick={() => handleDeleteStudent(student.id)}>✕</button>
              </div>
            ))}
          </div>
        </aside>

        <main className={styles.mainContent}>
          <h1>Assignments</h1>
          <div className={styles.assignmentsGrid}>
            {assignments.map(assignment => (
              <div
                key={assignment.id}
                className={styles.assignmentBox}
                onClick={() => {
                  console.log("Navigating to assignment details:", {
                    instructorId,
                    classId,
                    assignmentId: assignment.id
                  });
                  navigate(`/instructor/${instructorId}/classes/${classId}/assignments/${assignment.id}`);
                }}
              >
                <h3>{assignment.title}</h3>
                <p>Due: {assignment.due_date?.split('T')[0]}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAssignment(assignment.id);
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {/* Create Assignment Button */}
          <button
            className={styles.createAssignment}
            onClick={() => {
              console.log("Opening Create Assignment Modal");
              setShowCreateModal(true);
            }}
          >
            + Create Assignment
          </button>
        </main>
      </div>

      {showStudentModal && (
        <AddStudentModal
          onClose={() => setShowStudentModal(false)}
          onAdd={() => {
            fetchStudents();
            setShowStudentModal(false);
          }}
          classId={classId}
        />
      )}

      {showCreateModal && (
        <CreateAssignmentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={() => {
            fetchAssignments();
            setShowCreateModal(false);
          }}
          classId={classId}
        />
      )}
    </div>
  );
}
