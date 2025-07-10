// src/pages/HomeRedirect.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('token');

    if (userId && token) {
      // Assume user is logged in
      navigate(`/instructor-dashboard/${userId}`);
    } else {
      // Not logged in
      navigate('/landing'); // optional: rename Landing route
    }
  }, [navigate]);

  return null; // this component just redirects
}
