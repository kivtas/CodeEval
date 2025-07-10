import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import HomeRedirect from './pages/HomeRedirect.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import SetPassword from './pages/SetPassword.jsx';
import LoginInstructor from './pages/LoginInstructor.jsx';
import LoginStudent from './pages/LoginStudent.jsx';
import InstructorDashboard from './pages/InstructorDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ClassDashboard from './pages/ClassDashboard.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import StudentInfo from './pages/StudentInfo.jsx';
import AssignmentDetails from './pages/AssignmentDetails.jsx';
import StudentSubmissionDetails from './pages/StudentSubmissionDetails.jsx';
import StudentProtectedRoute from './components/StudentProtectedRoute';
import AssignmentSubmission from './pages/AssignmentSubmission.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/login/instructor" element={<LoginInstructor />} />
        <Route path="/login/student" element={<LoginStudent />} />
        <Route
          path="/instructor-dashboard/:instructorId"
          element={
            <ProtectedRoute routeIdKey="instructorId">
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/:instructorId/classes/:classId"
          element={
            <ProtectedRoute routeIdKey="instructorId">
              <ClassDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/:instructorId/classes/:classId/students/:studentId"
          element={
            <ProtectedRoute routeIdKey="instructorId">
              <StudentInfo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/:instructorId/classes/:classId/assignments/:assignmentId"
          element={
            <ProtectedRoute routeIdKey="instructorId">
              <AssignmentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/:instructorId/classes/:classId/assignments/:assignmentId/students/:studentId"
          element={
            <ProtectedRoute routeIdKey="instructorId">
              <StudentSubmissionDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/:studentId/dashboard"
          element={
            <StudentProtectedRoute>
              <StudentDashboard />
            </StudentProtectedRoute>
          }
        />

        <Route
          path="/student/:studentId/assignments/:assignmentId"
          element={
            <StudentProtectedRoute routeIdKey="studentId">
              <AssignmentSubmission />
            </StudentProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
