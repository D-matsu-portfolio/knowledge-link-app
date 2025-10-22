import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';
import { Container } from 'react-bootstrap';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // ユーザーがログインしていなければ、ログインページにリダイレクト
  if (!user) {
    return <Navigate to="/login" />;
  }

  // ログインしていれば、ナビゲーションバーと子コンポーネント（各ページ）を表示
  return (
    <>
      <NavBar />
      <Container>
        {children}
      </Container>
    </>
  );
}
