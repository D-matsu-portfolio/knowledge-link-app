import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Card, Alert, InputGroup, Row, Col } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import AuthBranding from '../components/AuthBranding';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('login-with-username', {
        body: { username, password },
      });
      if (invokeError) throw new Error(invokeError.message);
      if (data.error) throw new Error(data.error);
      const { data: { session }, error: sessionError } = await supabase.auth.setSession(data.session);
      if (sessionError) throw new Error(sessionError.message);
      if (!session) throw new Error('ログインに失敗しました。ユーザー名またはパスワードを確認してください。');
      navigate('/');
    } catch (err) {
      setError(err.message || 'ログイン中に不明なエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="vh-100">
      <Row className="h-100">
        <Col md={6} className="d-none d-md-flex p-0">
          <AuthBranding />
        </Col>
        <Col md={6} xs={12} className="d-flex align-items-center justify-content-center bg-light">
          <div className="w-100" style={{ maxWidth: "400px" }}>
            <Card className="shadow-lg">
              <Card.Body className="p-5">
                <h2 className="text-center mb-4">ログイン</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group id="username" className="mb-3">
                    <Form.Label>ユーザー名</Form.Label>
                    <Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                  </Form.Group>
                  <Form.Group id="password" className="mb-4">
                    <Form.Label>パスワード</Form.Label>
                    <InputGroup>
                      <Form.Control type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                  <Button disabled={loading} className="w-100" type="submit">
                    {loading ? <Spinner as="span" animation="border" size="sm" /> : 'ログイン'}
                  </Button>
                </Form>
                <div className="w-100 text-center mt-3">
                  <Link to="/signup">アカウントをお持ちでないですか？</Link>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
