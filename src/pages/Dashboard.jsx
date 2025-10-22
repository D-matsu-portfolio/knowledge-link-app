import React from 'react';
import { Card } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h2>Dashboard</h2>
      <Card>
        <Card.Body>
          <Card.Title>Welcome to KnowledgeLink!</Card.Title>
          <Card.Text>
            You are logged in as: <strong>{user?.email}</strong>
          </Card.Text>
          <Card.Text>
            ここには今後、あなたにおすすめの学習パートナーや、現在進行中のコミットメントなどが表示されます。
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
}
