import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Card, Alert, InputGroup, Row, Col, Spinner } from 'react-bootstrap';
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'ログイン中に不明なエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="min-vh-100">
      <Row className="h-100">
        <Col lg={6} className="d-flex p-0">
          <AuthBranding />
        </Col>
        <Col lg={6} xs={12} className="d-flex align-items-center justify-content-center bg-light">
          <div className="w-100 p-4" style={{ maxWidth: "400px" }}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                <h2 className="text-center mb-4">ログイン</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Floating className="mb-3">
                    <Form.Control id="username" type="text" placeholder="ユーザー名" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    <label htmlFor="username">ユーザー名</label>
                  </Form.Floating>
                  
                  <Form.Floating className="mb-4">
                    <Form.Control id="password" type={showPassword ? "text" : "password"} placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <label htmlFor="password">パスワード</label>
                    <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', position: 'absolute', right: 0, top: 0, height: '100%', zIndex: 3 }}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </InputGroup.Text>
                  </Form.Floating>

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
