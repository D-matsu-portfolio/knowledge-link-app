import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import InteractiveCard from '../components/InteractiveCard';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('TEACHABLE');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`id, username, bio, profile_skills(type, skills(name))`);
        if (error) throw error;
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        setError('ユーザー情報の取得に失敗しました: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = users.filter(user => 
      user.profile_skills.some(ps => 
        ps.type === searchType && ps.skills.name.toLowerCase().includes(lowercasedFilter)
      )
    );
    setFilteredUsers(filtered);
  }, [searchTerm, searchType, users]);

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <AnimatedPage>
      <Container>
        <h2 className="my-4">パートナーを探す</h2>
        <Card className="mb-4 p-3 shadow-sm">
          {/* ... (Search Form content) ... */}
        </Card>
        <Row>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <Col md={6} lg={4} key={user.id} className="mb-4">
                <InteractiveCard className="h-100 shadow-sm">
                  <Card.Body>
                    <Card.Title>{user.username || 'No Name'}</Card.Title>
                    <Card.Text className="text-muted">{user.bio ? `${user.bio.substring(0, 80)}...` : '自己紹介がありません。'}</Card.Text>
                    <div className="mb-2">
                      <h6>教えられるスキル</h6>
                      <div>
                        {user.profile_skills.filter(s => s.type === 'TEACHABLE').slice(0, 5).map(skill => (
                          <Badge pill bg="primary" key={skill.skills.name} className="me-1 mb-1">{skill.skills.name}</Badge>
                        ))}
                        {user.profile_skills.filter(s => s.type === 'TEACHABLE').length === 0 && <small className="text-muted">なし</small>}
                      </div>
                    </div>
                    <div>
                      <h6>学びたいスキル</h6>
                      <div>
                        {user.profile_skills.filter(s => s.type === 'LEARNABLE').slice(0, 5).map(skill => (
                          <Badge pill bg="success" key={skill.skills.name} className="me-1 mb-1">{skill.skills.name}</Badge>
                        ))}
                        {user.profile_skills.filter(s => s.type === 'LEARNABLE').length === 0 && <small className="text-muted">なし</small>}
                      </div>
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <Link to={`/users/${user.id}`} className="btn btn-outline-secondary btn-sm">詳細を見る</Link>
                  </Card.Footer>
                </InteractiveCard>
              </Col>
            ))
          ) : (
            <Col>
              <Alert variant="info">該当するユーザーが見つかりませんでした。</Alert>
            </Col>
          )}
        </Row>
      </Container>
    </AnimatedPage>
  );
}
