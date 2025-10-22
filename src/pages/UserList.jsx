import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('TEACHABLE'); // 'TEACHABLE' or 'LEARNABLE'

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            bio,
            profile_skills (
              type,
              skills ( name )
            )
          `);

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

  // 検索条件が変更されるたびにフィルタリングを実行
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = users.filter(user => {
      return user.profile_skills.some(ps => 
        ps.type === searchType && ps.skills.name.toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredUsers(filtered);
  }, [searchTerm, searchType, users]);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="my-4">ユーザーを探す</h2>
      
      {/* Search Form */}
      <Card className="mb-4 p-3 shadow-sm">
        <Form>
          <Row className="align-items-center">
            <Col md={6}>
              <Form.Group>
                <Form.Label>スキル名で検索</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="例: React, 英語, 料理..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="mt-3 mt-md-0">
              <Form.Group>
                <Form.Label>検索対象</Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    label="教えられるスキル"
                    name="searchType"
                    id="searchTeachable"
                    value="TEACHABLE"
                    checked={searchType === 'TEACHABLE'}
                    onChange={(e) => setSearchType(e.target.value)}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    label="学びたいスキル"
                    name="searchType"
                    id="searchLearnable"
                    value="LEARNABLE"
                    checked={searchType === 'LEARNABLE'}
                    onChange={(e) => setSearchType(e.target.value)}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* User List */}
      <Row>
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <Col md={6} lg={4} key={user.id} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>{user.username || 'No Name'}</Card.Title>
                  <Card.Text className="text-muted">
                    {user.bio ? `${user.bio.substring(0, 80)}...` : '自己紹介がありません。'}
                  </Card.Text>
                  
                  <div className="mb-2">
                    <h6>教えられるスキル</h6>
                    <div>
                      {user.profile_skills.filter(s => s.type === 'TEACHABLE').slice(0, 5).map(skill => (
                        <Badge pill bg="primary" key={skill.skills.name} className="me-1 mb-1">
                          {skill.skills.name}
                        </Badge>
                      ))}
                      {user.profile_skills.filter(s => s.type === 'TEACHABLE').length === 0 && <small className="text-muted">なし</small>}
                    </div>
                  </div>

                  <div>
                    <h6>学びたいスキル</h6>
                    <div>
                      {user.profile_skills.filter(s => s.type === 'LEARNABLE').slice(0, 5).map(skill => (
                        <Badge pill bg="success" key={skill.skills.name} className="me-1 mb-1">
                          {skill.skills.name}
                        </Badge>
                      ))}
                       {user.profile_skills.filter(s => s.type === 'LEARNABLE').length === 0 && <small className="text-muted">なし</small>}
                    </div>
                  </div>

                </Card.Body>
                <Card.Footer>
                  <Link to={`/users/${user.id}`} className="btn btn-outline-secondary btn-sm">
                    詳細を見る
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <Alert variant="info">該当するユーザーが見つかりませんでした。</Alert>
          </Col>
        )}
      </Row>
    </Container>
  );
}