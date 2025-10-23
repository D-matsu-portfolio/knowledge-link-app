import React from 'react';
import { FaChalkboardTeacher, FaUsers, FaHandshake } from 'react-icons/fa';

export default function AuthBranding() {
  return (
    <div className="h-100 p-5 text-white bg-primary d-flex flex-column justify-content-center">
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
    </div>
  );
}
