import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute
 * Renders children only when the user has a stored auth token.
 * Otherwise redirects to /login.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
