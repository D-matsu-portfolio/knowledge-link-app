import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Container, Row, Col, Card, Spinner, Alert, Button, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaAddressCard } from 'react-icons/fa';
import AnimatedPage from '../components/AnimatedPage';
import { motion } from 'framer-motion';

const WelcomeHeader = ({ profile, user }) => (
  <div className="p-5 mb-4 bg-light rounded-3">
    <Container fluid className="py-5">
      <h1 className="display-5 fw-bold">おかえりなさい, {profile?.username || user?.email}さん！</h1>
      <p className="col-md-8 fs-4">
        学習の旅を始めましょう。新しいパートナーを探したり、プロフィールを充実させて他の人に見つけてもらいやすくしましょう。
      </p>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="d-inline-block me-2">
        <Link to="/users" className="btn btn-primary btn-lg">
          <FaUserPlus className="me-2" />
          パートナーを探す
        </Link>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="d-inline-block">
        <Link to="/profile" className="btn btn-secondary btn-lg">
          <FaAddressCard className="me-2" />
          プロフィールを編集
        </Link>
      </motion.div>
    </Container>
  </div>
);

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activePartners, setActivePartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: requestsData, error: requestsError } = await supabase
          .from('commitments')
          .select('id, requester_id, requester:profiles!requester_id(username)')
          .eq('addressee_id', user.id)
          .eq('status', 'PENDING');
        if (requestsError) throw requestsError;
        setPendingRequests(requestsData);

        const { data: partnersData, error: partnersError } = await supabase
          .from('commitments')
          .select(`id, requester_id, addressee_id, requester:profiles!requester_id(username), addressee:profiles!addressee_id(username)`)
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'ACTIVE');
        if (partnersError) throw partnersError;
        
        const partners = partnersData.map(p => {
          const isRequester = p.requester_id === user.id;
          const partnerProfile = isRequester ? p.addressee : p.requester;
          const partnerId = isRequester ? p.addressee_id : p.requester_id;
          return { id: partnerId, username: partnerProfile.username, commitmentId: p.id };
        });
        setActivePartners(partners);

      } catch (err) {
        setError('ダッシュボード情報の取得に失敗しました: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <AnimatedPage>
      <Container>
        <WelcomeHeader profile={profile} user={user} />
        
        <Row>
          <Col md={12} className="mb-4">
            <Card>
              <Card.Header as="h5">あなたへの申請</Card.Header>
              <Card.Body>
                {pendingRequests.length > 0 ? (
                  <ListGroup variant="flush">
                    {pendingRequests.map(req => (
                      <ListGroup.Item key={req.id} action as={Link} to="/commitments">
                        <strong>{req.requester.username}</strong> さんからパートナー申請が届いています。
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p className="text-muted">新しい申請はありません。</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={12} className="mb-4">
            <Card>
              <Card.Header as="h5">契約中のパートナー</Card.Header>
              <Card.Body>
                {activePartners.length > 0 ? (
                  <ListGroup variant="flush">
                    {activePartners.map(partner => (
                      <ListGroup.Item key={partner.id} action as={Link} to={`/chat/${partner.commitmentId}`}>
                         <strong>{partner.username}</strong> さんと契約中です。チャットを開始しましょう。
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p className="text-muted">現在契約中のパートナーはいません。</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </AnimatedPage>
  );
}