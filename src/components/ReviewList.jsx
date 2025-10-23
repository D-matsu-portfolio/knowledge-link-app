import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

// 星評価を表示するためのコンポーネント
const StarRating = ({ rating }) => {
  return (
    <div>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return <FaStar key={ratingValue} color={ratingValue <= rating ? "#ffc107" : "#e4e5e9"} />;
      })}
    </div>
  );
};

export default function ReviewList({ userId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select(`*, reviewer:profiles!reviewer_id(username)`)
          .eq('reviewee_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data);

        // 平均評価を計算
        if (data.length > 0) {
          const totalRating = data.reduce((acc, review) => acc + review.rating, 0);
          setAverageRating((totalRating / data.length).toFixed(1));
        }

      } catch (err) {
        setError('評価の読み込みに失敗しました: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [userId]);

  if (loading) return <Spinner animation="border" size="sm" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Card>
      <Card.Header as="h5">受け取った評価</Card.Header>
      <Card.Body>
        {reviews.length > 0 ? (
          <>
            <div className="mb-3 text-center">
              <strong>平均評価: {averageRating}</strong> <FaStar color="#ffc107" className="mb-1" />
            </div>
            <ListGroup variant="flush">
              {reviews.map(review => (
                <ListGroup.Item key={review.id}>
                  <div className="d-flex justify-content-between">
                    <strong>{review.reviewer.username}さんからの評価</strong>
                    <small className="text-muted">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ja })}
                    </small>
                  </div>
                  <StarRating rating={review.rating} />
                  {review.comment && <p className="mt-2 mb-0">{review.comment}</p>}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        ) : (
          <p className="text-muted">まだ評価はありません。</p>
        )}
      </Card.Body>
    </Card>
  );
}
