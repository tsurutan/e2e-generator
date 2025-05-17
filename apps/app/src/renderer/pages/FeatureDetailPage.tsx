import React from 'react';
import { PageType, Feature } from '../App';
import ScenarioList from '../components/ScenarioList';
import '../styles/FeatureDetailPage.css';

interface FeatureDetailPageProps {
  onNavigate: (page: PageType) => void;
  feature: Feature;
}

const FeatureDetailPage: React.FC<FeatureDetailPageProps> = ({ onNavigate, feature }) => {
  // 機能一覧画面に戻る
  const handleBackClick = () => {
    onNavigate('feature-list');
  };

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '日付なし';
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '無効な日付' : date.toLocaleString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return '日付フォーマットエラー';
    }
  };

  return (
    <div className="feature-detail-page">
      <header className="header">
        <h1>機能詳細</h1>
      </header>

      <main className="content">
        <div className="controls">
          <button className="back-button" onClick={handleBackClick}>
            ← 機能一覧に戻る
          </button>
        </div>

        <div className="feature-detail">
          <div className="feature-header">
            <h2>{feature.name}</h2>
            <div className="feature-meta">
              <p className="feature-date">
                作成日時: {formatDate(feature.createdAt)}
              </p>
              <p className="feature-date">
                更新日時: {formatDate(feature.updatedAt)}
              </p>
            </div>
          </div>

          <div className="feature-description-section">
            <h3>機能説明</h3>
            <p className="feature-description">{feature.description}</p>
          </div>

          <div className="scenarios-section">
            <h3>シナリオ一覧</h3>
            <div className="scenarios-container">
              <ScenarioList featureId={feature.id} alwaysExpanded={true} />
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© 2023 E2E Testing Application</p>
      </footer>
    </div>
  );
};

export default FeatureDetailPage;
