import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Container, Tabs, Tab, Card, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Commitments() {
  const { user } = useAuth();
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCommitments = async () => {
      setLoading(true);
      try {
        // 自分宛の申請を取得 (addressee_idが自分)
        const { data: receivedData, error: receivedError } = await supabase
          .from('commitments')
          .select(`*, requester:profiles!requester_id(username)`)
          .eq('addressee_id', user.id);
        if (receivedError) throw receivedError;
        setReceivedRequests(receivedData);

        // 自分からの申請を取得 (requester_idが自分)
        const { data: sentData, error: sentError } = await supabase
          .from('commitments')
          .select(`*, addressee:profiles!addressee_id(username)`)
          .eq('requester_id', user.id);
        if (sentError) throw sentError;
        setSentRequests(sentData);

      } catch (error) {
        setError('契約情報の取得に失敗しました: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCommitments();
    }
  }, [user]);

  const handleUpdateRequest = async (id, newStatus) => {
    // Optimistic UI update
    const originalRequests = [...receivedRequests];
    const updatedRequests = receivedRequests.map(req => 
      req.id === id ? { ...req, status: newStatus } : req
    );
    setReceivedRequests(updatedRequests);

    try {
      const { error } = await supabase
        .from('commitments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        // If error, revert the UI update
        setReceivedRequests(originalRequests);
        throw error;
      }
    } catch (error) {
      setError(`ステータスの更新に失敗しました: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <Badge bg="warning">申請中</Badge>;
      case 'ACTIVE': return <Badge bg="success">契約中</Badge>;
      case 'COMPLETED': return <Badge bg="secondary">完了</Badge>;
      case 'REJECTED': return <Badge bg="danger">拒否</Badge>;
      default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container>
      <h2 className="my-4">契約管理</h2>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      <Tabs defaultActiveKey="received" id="commitments-tabs" className="mb-3">
        <Tab eventKey="received" title={`あなたへの申請 (${receivedRequests.length})`}>
          {receivedRequests.length > 0 ? receivedRequests.map(req => (
            <Card key={req.id} className="mb-3">
              <Card.Body>
                <Card.Title>
                  <Link to={`/users/${req.requester_id}`}>{req.requester.username}</Link> さんからの申請
                </Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  ステータス: {getStatusBadge(req.status)}
                </Card.Subtitle>
                <Card.Text><strong>目標:</strong> {req.goal}</Card.Text>
                {req.status === 'PENDING' && (
                  <div>
                    <Button variant="success" className="me-2" onClick={() => handleUpdateRequest(req.id, 'ACTIVE')}>承認</Button>
                    <Button variant="danger" onClick={() => handleUpdateRequest(req.id, 'REJECTED')}>拒否</Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )) : <p>あなたへの申請はまだありません。</p>}
        </Tab>
        <Tab eventKey="sent" title={`あなたからの申請 (${sentRequests.length})`}>
          {sentRequests.length > 0 ? sentRequests.map(req => (
            <Card key={req.id} className="mb-3">
              <Card.Body>
                <Card.Title>
                  <Link to={`/users/${req.addressee_id}`}>{req.addressee.username}</Link> さんへの申請
                </Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  ステータス: {getStatusBadge(req.status)}
                </Card.Subtitle>
                <Card.Text><strong>目標:</strong> {req.goal}</Card.Text>
              </Card.Body>
            </Card>
          )) : <p>あなたからの申請はまだありません。</p>}
        </Tab>
      </Tabs>
    </Container>
  );
}
