import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Container, Row, Col, Card, Spinner, Alert, Button, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activePartners, setActivePartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. 自分宛の保留中リクエストを取得
        const { data: requestsData, error: requestsError } = await supabase
          .from('commitments')
          .select('id, requester_id, requester:profiles!requester_id(username)')
          .eq('addressee_id', user.id)
          .eq('status', 'PENDING');
        if (requestsError) throw requestsError;
        setPendingRequests(requestsData);

        // 2. 契約中のパートナーを取得
        const { data: partnersData, error: partnersError } = await supabase
          .from('commitments')
          .select(`
            id,
            requester_id,
            addressee_id,
            requester:profiles!requester_id(username),
            addressee:profiles!addressee_id(username)
          `)
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'ACTIVE');
        if (partnersError) throw partnersError;
        
        // 相手の情報を抽出
        const partners = partnersData.map(p => {
          const isRequester = p.requester_id === user.id;
          const partnerProfile = isRequester ? p.addressee : p.requester;
          const partnerId = isRequester ? p.addressee_id : p.requester_id;
          return { id: partnerId, username: partnerProfile.username };
        });
        setActivePartners(partners);

      } catch (err) {
        setError('ダッシュボード情報の取得に失敗しました: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container>
      <h2 className="my-4">ダッシュボード</h2>
      <Row>
        {/* Welcome Card */}
        <Col md={12} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>おかえりなさい, {profile?.username || user?.email}さん！</Card.Title>
              <Card.Text>
                KnowledgeLinkへようこそ！あなたの学習パートナーシップの状況は以下の通りです。
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Pending Requests & Active Partners */}
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>あなたへの申請</Card.Title>
              {pendingRequests.length > 0 ? (
                <>
                  <ListGroup variant="flush">
                    {pendingRequests.slice(0, 3).map(req => (
                      <ListGroup.Item key={req.id} className="d-flex justify-content-between align-items-center">
                        <Link to={`/users/${req.requester_id}`}>{req.requester.username}</Link> さんからの申請
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  <div className="text-center mt-3">
                    <Button as={Link} to="/commitments" variant="primary">全ての申請を見る</Button>
                  </div>
                </>
              ) : (
                <p className="text-muted">新しい申請はありません。</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>契約中のパートナー</Card.Title>
              {activePartners.length > 0 ? (
                <ListGroup variant="flush">
                  {activePartners.map((partner, index) => (
                    <ListGroup.Item key={`partner-${partner.id}-${index}`}>
                      <Link to={`/users/${partner.id}`}>{partner.username}</Link>
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
  );
}
