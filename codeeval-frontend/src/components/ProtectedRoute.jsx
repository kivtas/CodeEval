// src/components/ProtectedRoute.jsx
import { Navigate, useParams } from 'react-router-dom';

export default function ProtectedRoute({ children, routeIdKey }) {
  const token = localStorage.getItem('token');
  const instructorId = localStorage.getItem('instructorId');
  const params = useParams();

  if (!token || !instructorId) {
    return <Navigate to="/" replace />;
  }

  if (routeIdKey) {
    const routeInstructorId = params[routeIdKey];
    if (routeInstructorId !== instructorId) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
