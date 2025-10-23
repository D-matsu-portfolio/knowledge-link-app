import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Container, Form, Button, Card, Spinner, Alert, InputGroup } from 'react-bootstrap';

export default function Chat() {
  const { commitmentId } = useParams();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [commitmentInfo, setCommitmentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: cData, error: cError } = await supabase
          .from('commitments')
          .select(`requester_id, addressee_id, requester:profiles!requester_id(username), addressee:profiles!addressee_id(username)`)
          .eq('id', commitmentId)
          .single();
        if (cError) throw cError;
        
        const partner = cData.requester_id === user.id ? cData.addressee : cData.requester;
        setCommitmentInfo({ partnerName: partner.username });

        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*, sender:profiles!sender_id(username)')
          .eq('commitment_id', commitmentId)
          .order('created_at', { ascending: true });
        if (messagesError) throw messagesError;
        setMessages(messagesData);

      } catch (err) {
        setError('チャット情報の読み込みに失敗しました: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [commitmentId, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`messages:commitment_id=eq.${commitmentId}`);
    
    const subscription = channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `commitment_id=eq.${commitmentId}` },
      async (payload) => {
        if (payload.new.sender_id === user.id) {
          return;
        }
        
        const { data: senderProfile, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', payload.new.sender_id)
          .single();
        
        if (error) {
          console.error("Error fetching sender profile for realtime message:", error);
        } else {
          const newMessageWithSender = { ...payload.new, sender: senderProfile };
          setMessages(prevMessages => [...prevMessages, newMessageWithSender]);
        }
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commitmentId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile) return;

    const tempMessage = {
      id: `temp-${Date.now()}`,
      commitment_id: commitmentId,
      sender_id: user.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      sender: { username: profile.username }
    };

    setMessages(prevMessages => [...prevMessages, tempMessage]);
    const messageToSend = newMessage;
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({ commitment_id: commitmentId, sender_id: user.id, content: messageToSend.trim() });
      
      if (error) {
        setError('メッセージの送信に失敗しました: ' + error.message);
        setMessages(prevMessages => prevMessages.filter(m => m.id !== tempMessage.id));
      }
    } catch (err) {
      setError('メッセージの送信に失敗しました: ' + err.message);
      setMessages(prevMessages => prevMessages.filter(m => m.id !== tempMessage.id));
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container>
      <h2 className="my-4">チャット: {commitmentInfo?.partnerName}さん</h2>
      <Card>
        <Card.Body style={{ height: '60vh', overflowY: 'auto' }}>
          {messages.map(msg => (
            <div key={msg.id} className={`d-flex mb-3 ${msg.sender_id === user.id ? 'justify-content-end' : ''}`}>
              <div style={{ maxWidth: '70%' }}>
                <small className="text-muted">{msg.sender?.username || '...'}</small>
                <div className={`p-2 rounded ${msg.sender_id === user.id ? 'bg-primary text-white' : 'bg-light'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </Card.Body>
        <Card.Footer>
          <Form onSubmit={handleSendMessage}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="メッセージを入力..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={!profile}
              />
              <Button variant="primary" type="submit" disabled={!profile}>送信</Button>
            </InputGroup>
          </Form>
        </Card.Footer>
      </Card>
    </Container>
  );
}