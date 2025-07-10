// src/components/StudentProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function StudentProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const studentId = localStorage.getItem("studentId");

  if (!token || !studentId) {
    return <Navigate to="/" replace />;
  }

  return children;
}