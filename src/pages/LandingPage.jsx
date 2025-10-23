import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import { FaChalkboardTeacher, FaUsers, FaHandshake, FaRocket } from 'react-icons/fa';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3, // 間隔を少し長く
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const features = [
  {
    icon: <FaChalkboardTeacher size="3em" className="text-primary mb-3" />,
    title: 'スキルを教える・学ぶ',
    text: 'あなたの得意なことを誰かに教えたり、学びたいスキルを持つ人から直接学んだり。知識の交換が、ここから始まります。',
  },
  {
    icon: <FaUsers size="3em" className="text-primary mb-3" />,
    title: '最適なパートナー探し',
    text: '豊富なスキルカテゴリと高度な検索機能で、あなたの学習目標にぴったりのパートナーを簡単に見つけられます。',
  },
  {
    icon: <FaHandshake size="3em" className="text-primary mb-3" />,
    title: '目標へのコミット',
    text: '「パートナー契約」を結ぶことで、お互いの目標達成への意識が高まります。一人では続かない学習も、パートナーと一緒なら乗り越えられます。',
  },
];

export default function LandingPage() {
  return (
    <AnimatedPage>
      {/* Hero Section */}
      <Container fluid className="text-center p-5 bg-light overflow-hidden">
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.h1 variants={itemVariants} className="display-3 fw-bold mt-5">KnowledgeLink</motion.h1>
          <motion.p variants={itemVariants} className="fs-4 text-muted mb-5">知識で繋がる、新しい学びの形。</motion.p>
          <motion.div variants={itemVariants}>
            <img 
              src="/hero-image.png" 
              alt="学び合う人々のイラスト" 
              className="img-fluid rounded shadow-sm mb-5"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }} className="d-inline-block me-2">
              <Link to="/signup" className="btn btn-primary btn-lg px-4">
                <FaRocket className="me-2" />
                今すぐ無料で始める
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }} className="d-inline-block">
              <Link to="/login" className="btn btn-secondary btn-lg px-4">
                ログイン
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </Container>

      {/* Features Section */}
      <Container className="py-5">
        <h2 className="text-center mb-5">KnowledgeLinkでできること</h2>
        <Row>
          {features.map((feature, index) => (
            <Col md={4} key={index} className="mb-4">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Card className="text-center h-100 border-0 shadow-sm">
                  <Card.Body className="p-4">
                    {feature.icon}
                    <Card.Title as="h4" className="mb-3">{feature.title}</Card.Title>
                    <Card.Text>{feature.text}</Card.Text>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Final CTA Section */}
      <Container fluid className="text-center p-5 bg-primary text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="display-5 fw-bold">さあ、新しい学びの旅へ</h2>
          <p className="fs-4 my-4">あなたの知識が、誰かの未来を照らす。あなたの学びたい意欲が、新しい繋がりを生む。</p>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link to="/signup" className="btn btn-light btn-lg px-5">
              無料で新規登録
            </Link>
          </motion.div>
        </motion.div>
      </Container>

      {/* Footer */}
      <footer className="text-center p-4 bg-light">
        <p className="mb-0">&copy; 2025 KnowledgeLink. All Rights Reserved.</p>
      </footer>
    </AnimatedPage>
  );
}
