import { Navbar, Nav, Container, Button, Dropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { FaBell } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function NavBar() {
  const { user, profile, signOut } = useAuth();
  const { notifications, clearNotifications } = useNotifications();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNavigate = (link) => {
    navigate(link);
  };

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ja });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return '';
    }
  };

  return (
    <Navbar bg="light" expand="lg" className="mb-4 shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/">KnowledgeLink</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">ダッシュボード</Nav.Link>
            <Nav.Link as={Link} to="/users">パートナーを探す</Nav.Link>
            <Nav.Link as={Link} to="/commitments">契約管理</Nav.Link>
            <Nav.Link as={Link} to="/profile">プロフィール</Nav.Link>
          </Nav>
          <Nav className="align-items-center">
            {user && (
              <>
                <Dropdown onToggle={(isOpen) => {
                  if (!isOpen && notifications.length > 0) {
                    clearNotifications();
                  }
                }}>
                  <Dropdown.Toggle variant="light" id="dropdown-notifications" className="me-3">
                    <FaBell />
                    {notifications.length > 0 && (
                      <Badge pill bg="danger" style={{ position: 'absolute', top: '-5px', right: '0px' }}>
                        {notifications.length}
                      </Badge>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <Dropdown.Item key={notif.id} onClick={() => handleNavigate(notif.link || '#')}>
                          <div>{notif.message}</div>
                          <small className="text-muted">{formatTimestamp(notif.createdAt)}</small>
                        </Dropdown.Item>
                      ))
                    ) : (
                      <Dropdown.Item disabled>新しい通知はありません</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>

                <Navbar.Text className="me-3">
                  ログイン中: {profile?.username || user.email}
                </Navbar.Text>
                <Button variant="outline-danger" onClick={handleSignOut}>
                  ログアウト
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
