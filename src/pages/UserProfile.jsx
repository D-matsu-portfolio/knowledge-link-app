import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button, Modal, Form } from 'react-bootstrap';
import ReviewList from '../components/ReviewList';
import AnimatedPage from '../components/AnimatedPage';

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [goal, setGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`id, username, bio, profile_skills(type, skills(name, category))`)
          .eq('id', id)
          .single();
        if (error) throw error;
        setProfile(data);
      } catch (error) {
        setError('プロフィールの取得に失敗しました: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleCommitmentRequest = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const { error: insertError } = await supabase
        .from('commitments')
        .insert({
          requester_id: currentUser.id,
          addressee_id: profile.id,
          goal: goal,
          status: 'PENDING'
        });
      if (insertError) throw insertError;
      setSuccess('パートナー契約を申請しました！');
      setShowModal(false);
      setGoal('');
    } catch (error) {
      setError('申請に失敗しました: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error || !profile) return <Container className="mt-5"><Alert variant="danger">{error || 'ユーザーが見つかりませんでした。'}</Alert></Container>;

  const teachableSkills = profile.profile_skills.filter(s => s.type === 'TEACHABLE');
  const learnableSkills = profile.profile_skills.filter(s => s.type === 'LEARNABLE');
  const cameFromCommitments = location.state?.from === 'commitments';

  return (
    <AnimatedPage>
      <Container className="my-4">
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm mb-4">
              <Card.Header as="h3" className="text-center">{profile.username || '名前未設定'}</Card.Header>
              <Card.Body>
                <Card.Text>{profile.bio || <span className="text-muted">自己紹介がありません。</span>}</Card.Text>
                <hr />
                <Row>
                  <Col md={6} className="mb-3 mb-md-0">
                    <h5>教えられるスキル</h5>
                    {teachableSkills.length > 0 ? teachableSkills.map(skill => (
                      <Badge pill bg="primary" key={skill.skills.name} className="me-1 mb-1 p-2">{skill.skills.name}</Badge>
                    )) : <p className="text-muted">登録されているスキルはありません。</p>}
                  </Col>
                  <Col md={6}>
                    <h5>学びたいスキル</h5>
                    {learnableSkills.length > 0 ? learnableSkills.map(skill => (
                      <Badge pill bg="success" key={skill.skills.name} className="me-1 mb-1 p-2">{skill.skills.name}</Badge>
                    )) : <p className="text-muted">登録されているスキルはありません。</p>}
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer className="text-center">
                {currentUser.id === profile.id ? (
                  <Button as={Link} to="/profile" variant="secondary">自分のプロフィールを編集</Button>
                ) : (
                  <>
                    {cameFromCommitments ? (
                      <Button variant="secondary" onClick={() => navigate(-1)}>戻る</Button>
                    ) : (
                      <Button variant="info" onClick={() => setShowModal(true)}>パートナー契約を申請する</Button>
                    )}
                  </>
                )}
              </Card.Footer>
            </Card>
            
            <div className="mt-4">
              <ReviewList userId={id} />
            </div>
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>パートナー契約の申請</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCommitmentRequest}>
          <Modal.Body>
            <p><strong>{profile?.username || '相手'}</strong>さんにパートナー契約を申請します。</p>
            <Form.Group>
              <Form.Label>学習の目標や、相手に何を教えてほしいかを具体的に書きましょう。</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="例: Reactの基本的な使い方を学び、簡単なTodoアプリを作れるようになりたいです。"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>キャンセル</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : '申請する'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </AnimatedPage>
  );
}
