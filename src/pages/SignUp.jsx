import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Card, Alert, InputGroup, Row, Col, Spinner } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import AuthBranding from '../components/AuthBranding';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data: existingUser, error: checkError } = await supabase.from('profiles').select('username').eq('username', username).single();
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingUser) throw new Error('このユーザー名は既に使用されています。');

      const { error: signUpError } = await signUp({ email, password, options: { data: { username: username } } });
      if (signUpError) throw signUpError;
      setMessage('登録確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。');
    } catch (err) {
      setError(err.message);
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
                <h2 className="text-center mb-4">新規登録</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                {message && <Alert variant="success">{message}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group id="username" className="mb-3">
                    <Form.Label>ユーザー名</Form.Label>
                    <Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                  </Form.Group>
                  <Form.Group id="email" className="mb-3">
                    <Form.Label>メールアドレス</Form.Label>
                    <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
                    {loading ? <Spinner as="span" animation="border" size="sm" /> : '登録する'}
                  </Button>
                </Form>
                <div className="w-100 text-center mt-3">
                  <Link to="/login">すでにアカウントをお持ちですか？</Link>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
}