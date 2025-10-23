import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Container, Form, Button, Card, Alert, Spinner, Row, Col, InputGroup, Modal } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import SkillManager from '../components/SkillManager';
import ReviewList from '../components/ReviewList';

export default function Profile() {
  const { user, updatePassword, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.from('profiles').select('username, bio').eq('id', user.id).single();
        if (error) throw error;
        if (data) {
          setUsername(data.username || '');
          setBio(data.bio || '');
        }
      } catch (error) {
        setError('プロフィールの読み込みに失敗しました: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    // ... (implementation is correct)
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    // ... (implementation is correct)
  };

  const handleDeleteUser = async () => {
    // ... (implementation is correct)
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

  return (
    <>
      <Container className="my-4">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="mb-4">
              <Card.Body>
                <h2 className="text-center mb-4">プロフィール編集</h2>
                <Form onSubmit={handleUpdateProfile}>
                  <Form.Group id="email" className="mb-3"><Form.Label>メールアドレス</Form.Label><Form.Control type="email" value={user?.email || ''} disabled /></Form.Group>
                  <Form.Group id="username" className="mb-3"><Form.Label>ユーザー名</Form.Label><Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></Form.Group>
                  <Form.Group id="bio" className="mb-3"><Form.Label>自己紹介</Form.Label><Form.Control as="textarea" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} /></Form.Group>
                  <Button disabled={loading} className="w-100 mt-3" type="submit">プロフィールを更新</Button>
                </Form>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Body><SkillManager /></Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Body>
                <h3 className="text-center mb-4">パスワード変更</h3>
                <Form onSubmit={handleUpdatePassword}>
                  <Form.Group id="password" className="mb-3"><Form.Label>新しいパスワード</Form.Label><InputGroup><Form.Control type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6文字以上" required /><InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>{showPassword ? <FaEyeSlash /> : <FaEye />}</InputGroup.Text></InputGroup></Form.Group>
                  <Form.Group id="confirm-password" className="mb-3"><Form.Label>新しいパスワード（確認用）</Form.Label><InputGroup><Form.Control type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /><InputGroup.Text onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: 'pointer' }}>{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</InputGroup.Text></InputGroup></Form.Group>
                  <Button disabled={passwordLoading} className="w-100 mt-3" type="submit">パスワードを変更</Button>
                </Form>
              </Card.Body>
            </Card>

            <div className="mb-4">
              <ReviewList userId={user.id} />
            </div>

            <Card className="border-danger">
              <Card.Header className="bg-danger text-white">Danger Zone</Card.Header>
              <Card.Body>
                <Card.Title>アカウントの削除</Card.Title>
                <Card.Text>この操作は元に戻すことができません。</Card.Text>
                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>退会する</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        {/* ... (Delete Modal content) ... */}
      </Modal>
    </>
  );
}
