import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Card, Alert, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

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
      // 作成したEdge Functionを呼び出す
      const { data, error: invokeError } = await supabase.functions.invoke('login-with-username', {
        body: { username, password },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }
      
      // Edge Function内でエラーが投げられた場合
      if (data.error) {
        throw new Error(data.error);
      }

      // Edge Functionから返されたセッション情報を使って、クライアントの認証状態を更新
      const { data: { session }, error: sessionError } = await supabase.auth.setSession(data.session);

      if (sessionError) {
        throw new Error(sessionError.message);
      }
      
      // セッションが正常に設定されなかった場合
      if (!session) {
         throw new Error('ログインに失敗しました。ユーザー名またはパスワードを確認してください。');
      }

      navigate('/'); // ログイン成功後、ダッシュボードページにリダイレクト

    } catch (err) {
      setError(err.message || 'ログイン中に不明なエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">ログイン</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="username" className="mb-3">
                <Form.Label>ユーザー名</Form.Label>
                <Form.Control 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                />
              </Form.Group>
              <Form.Group id="password">
                <Form.Label>パスワード</Form.Label>
                <InputGroup>
                  <Form.Control 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                  <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>
              <Button disabled={loading} className="w-100 mt-3" type="submit">
                ログイン
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          アカウントをお持ちでないですか？ <Link to="/signup">ユーザー登録</Link>
        </div>
      </div>
    </Container>
  );
}