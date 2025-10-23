import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaChalkboardTeacher, FaUsers, FaHandshake, FaLightbulb, FaBullseye, FaTasks } from 'react-icons/fa';

export default function AuthBranding() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="p-5 text-white bg-primary d-flex flex-column justify-content-center w-100">
        <h1 className="display-4 mb-4">KnowledgeLink</h1>
        <p className="lead mb-4">知識で繋がる、新しい学びの形。</p>
        
        <div className="mt-4">
          <div className="d-flex align-items-center mb-3">
            <FaChalkboardTeacher size="2em" className="me-3" />
            <p className="mb-0 fs-5">あなたのスキルを誰かに教えよう</p>
          </div>
          <div className="d-flex align-items-center mb-3">
            <FaUsers size="2em" className="me-3" />
            <p className="mb-0 fs-5">学びたいスキルを持つパートナーを見つけよう</p>
          </div>
          <div className="d-flex align-items-center">
            <FaHandshake size="2em" className="me-3" />
            <p className="mb-0 fs-5">目標達成にコミットするパートナーシップ</p>
          </div>
        </div>

        <div className="mt-5">
          <Button variant="outline-light" onClick={() => setShowModal(true)}>
            <FaLightbulb className="me-2" />
            さらに詳しく
          </Button>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaLightbulb className="me-2" /> KnowledgeLinkへようこそ！
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="mb-4">
            <h5 className="d-flex align-items-center"><FaBullseye className="me-2 text-primary" /> 私たちのミッション</h5>
            <p className="mt-2 ps-4">
              KnowledgeLinkは、単なるスキル交換のマッチングサービスではありません。私たちは、「誰かに教える」という経験と、「目標達成に向けて誰かと一緒に頑張る」というコミットメントが、最も効果的な学習方法であると信じています。このプラットフォームは、その二つを組み合わせた、新しい形の学習コミュニティです。
            </p>
          </div>
          
          <div className="mb-4">
            <h5 className="d-flex align-items-center"><FaTasks className="me-2 text-primary" /> 主な機能</h5>
            <ul className="list-unstyled mt-3 ps-4">
              <li className="mb-2"><strong>自由なスキル登録:</strong> プログラミングからコーヒーの淹れ方まで、あなたが教えられること、学びたいことを何でも登録できます。</li>
              <li className="mb-2"><strong>高度なパートナー検索:</strong> 「Reactを教えてくれる人」など、具体的なニーズで最適なパートナーを探せます。</li>
              <li className="mb-2"><strong>パートナー契約:</strong> お互いの目標と意思を確認し、学習パートナーシップ契約を結びます。</li>
              <li className="mb-2"><strong>リアルタイムチャット:</strong> 契約中のパートナーと、学習の進捗報告や相談などを安全に行えます。</li>
              <li className="mb-2"><strong>評価システム:</strong> 契約完了後にお互いを評価し合うことで、信頼性の高いコミュニティを築きます。</li>
            </ul>
          </div>

          <p className="text-center mt-4 fw-bold">
            さあ、あなたもKnowledgeLinkで新しい学びの旅を始めましょう！
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowModal(false)}>
            閉じる
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}