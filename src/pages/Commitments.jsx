import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Container, Tabs, Tab, Card, Spinner, Alert, Button, Badge, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { FaExternalLinkAlt, FaStar } from 'react-icons/fa';

export default function Commitments() {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [commitmentToReview, setCommitmentToReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchCommitments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commitments')
        .select(`
          *,
          requester:profiles!requester_id(username),
          addressee:profiles!addressee_id(username),
          reviews ( reviewer_id )
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const processedData = data.map(c => ({
        ...c,
        iHaveReviewed: c.reviews.some(r => r.reviewer_id === user.id)
      }));
      setCommitments(processedData);

    } catch (error) {
      setError('契約情報の取得に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitments();
  }, [user]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('commitments').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      fetchCommitments();
    } catch (error) {
      setError(`ステータスの更新に失敗しました: ${error.message}`);
    }
  };

  const handleCompleteRequest = (commitment) => {
    handleUpdateStatus(commitment.id, 'COMPLETED');
    setCommitmentToReview(commitment);
    setShowReviewModal(true);
  };

  const handleOpenReviewModal = (commitment) => {
    setCommitmentToReview(commitment);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert('評価を星1以上で選択してください。');
    setReviewSubmitting(true);
    setError('');
    try {
      const revieweeId = commitmentToReview.requester_id === user.id ? commitmentToReview.addressee_id : commitmentToReview.requester_id;
      const { error: reviewError } = await supabase.from('reviews').insert({
        commitment_id: commitmentToReview.id,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating: rating,
        comment: comment,
      });
      if (reviewError) throw reviewError;

      setShowReviewModal(false);
      setRating(0);
      setHoverRating(0);
      setComment('');
      fetchCommitments();
    } catch (err) {
      setError('レビューの送信に失敗しました: ' + err.message);
    } finally {
      setReviewSubmitting(false);
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
  
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: ja });
    } catch (e) {
      return '無効な日付';
    }
  };

  const openDetailModal = (commitment) => {
    setSelectedCommitment(commitment);
    setShowDetailModal(true);
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  const renderCommitmentCard = (req) => {
    const isReceived = req.addressee_id === user.id;
    const partner = isReceived ? req.requester : req.addressee;
    const partnerId = isReceived ? req.requester_id : req.addressee_id;
    const titlePrefix = isReceived ? '申請者:' : '宛先:';

    return (
      <Card key={req.id} className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <Card.Title className="d-flex align-items-center">{titlePrefix}<Link to={`/users/${partnerId}`} state={{ from: 'commitments' }} className="ms-2 d-flex align-items-center">{partner.username}<FaExternalLinkAlt className="ms-1" size="0.8em" /></Link></Card.Title>
              <Card.Subtitle className="mb-2 text-muted">ステータス: {getStatusBadge(req.status)}</Card.Subtitle>
            </div>
            <Button variant="outline-secondary" size="sm" onClick={() => openDetailModal(req)}>詳細</Button>
          </div>
          <Card.Text className="mt-2"><strong>目標:</strong> {req.goal.substring(0, 100)}{req.goal.length > 100 ? '...' : ''}</Card.Text>
          
          <div className="mt-3">
            {isReceived && req.status === 'PENDING' && (<><Button variant="success" className="me-2" onClick={() => handleUpdateStatus(req.id, 'ACTIVE')}>承認</Button><Button variant="danger" onClick={() => handleUpdateStatus(req.id, 'REJECTED')}>拒否</Button></>)}
            {req.status === 'ACTIVE' && (<><Button as={Link} to={`/chat/${req.id}`} variant="primary" className="me-2">チャットを開く</Button><Button variant="outline-success" onClick={() => handleCompleteRequest(req)}>契約を完了する</Button></>)}
            {req.status === 'COMPLETED' && !req.iHaveReviewed && (<Button variant="outline-info" onClick={() => handleOpenReviewModal(req)}>相手を評価する</Button>)}
          </div>
        </Card.Body>
        <Card.Footer className="text-muted" style={{ fontSize: '0.85rem' }}>申請日時: {formatDate(req.created_at)} | 最終更新: {formatDate(req.updated_at)}</Card.Footer>
      </Card>
    );
  };

  const renderDetailModal = () => {
    if (!selectedCommitment) return null;
    const isReceived = selectedCommitment.addressee_id === user.id;
    const partner = isReceived ? selectedCommitment.requester : selectedCommitment.addressee;
    return (
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>契約詳細</Modal.Title></Modal.Header>
        <Modal.Body>
          <p><strong>申請者:</strong> {isReceived ? partner.username : 'あなた'}</p>
          <p><strong>宛先:</strong> {isReceived ? 'あなた' : partner.username}</p>
          <p><strong>ステータス:</strong> {getStatusBadge(selectedCommitment.status)}</p>
          <hr />
          <h5>目標</h5>
          <p style={{ whiteSpace: 'pre-wrap' }}>{selectedCommitment.goal}</p>
          <hr />
          <small className="text-muted">申請日時: {formatDate(selectedCommitment.created_at)}</small><br/>
          <small className="text-muted">最終更新: {formatDate(selectedCommitment.updated_at)}</small>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowDetailModal(false)}>閉じる</Button></Modal.Footer>
      </Modal>
    );
  };

  const renderReviewModal = () => {
    if (!commitmentToReview) return null;
    return (
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>契約の完了と評価</Modal.Title></Modal.Header>
        <Form onSubmit={handleReviewSubmit}>
          <Modal.Body>
            <p>契約を完了し、パートナーを評価します。この操作は元に戻せません。</p>
            <Form.Group className="mb-3">
              <Form.Label>評価 (星をクリック)</Form.Label>
              <div>
                {[...Array(5)].map((_, index) => {
                  const ratingValue = index + 1;
                  return <FaStar key={ratingValue} size={25} color={ratingValue <= (hoverRating || rating) ? "#ffc107" : "#e4e5e9"} onMouseEnter={() => setHoverRating(ratingValue)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(ratingValue)} style={{ cursor: 'pointer', marginRight: '5px' }} />;
                })}
              </div>
            </Form.Group>
            <Form.Group><Form.Label>コメント (任意)</Form.Label><Form.Control as="textarea" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>キャンセル</Button>
            <Button variant="primary" type="submit" disabled={reviewSubmitting}>{reviewSubmitting ? <Spinner size="sm" /> : '完了して評価を送信'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  };

  const receivedRequests = commitments.filter(c => c.addressee_id === user.id);
  const sentRequests = commitments.filter(c => c.requester_id === user.id);

  return (
    <Container>
      <h2 className="my-4">契約管理</h2>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      <Tabs defaultActiveKey="received" id="commitments-tabs" className="mb-3">
        <Tab eventKey="received" title={`あなたへの申請 (${receivedRequests.length})`}>{receivedRequests.map(req => renderCommitmentCard(req))}</Tab>
        <Tab eventKey="sent" title={`あなたからの申請 (${sentRequests.length})`}>{sentRequests.map(req => renderCommitmentCard(req))}</Tab>
      </Tabs>
      {renderDetailModal()}
      {renderReviewModal()}
    </Container>
  );
}
