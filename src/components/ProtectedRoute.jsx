import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="app-container">
      <NavBar />
      <main>
        {children}
      </main>
    </div>
  );
}
