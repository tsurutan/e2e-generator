import React, { useState, useEffect } from 'react';
import { PageType, Feature } from '../App';
import ScenarioList from '../components/ScenarioList';
import '../styles/FeatureListPage.css';

// Feature interface is now imported from App.tsx

interface FeatureListPageProps {
  onNavigate: (page: PageType) => void;
  projectId?: string;
  onSelectFeature?: (feature: Feature) => void;
}

const FeatureListPage: React.FC<FeatureListPageProps> = ({ onNavigate, projectId, onSelectFeature }) => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 機能一覧を取得
  useEffect(() => {
    setLoading(true);
    setError(null);

    // デバッグ情報を表示
    console.log('Fetching features with projectId:', projectId);

    // メインプロセスに機能一覧取得リクエストを送信
    window.api.send('get-features', { projectId });

    // メインプロセスからの応答を受信
    const handleMessage = (message: any) => {
      console.log('Received message from main process:', message);
      if (message.type === 'features-loaded') {
        console.log('Features loaded:', message.data);
        // APIからのレスポンスが配列か確認
        if (Array.isArray(message.data)) {
          setFeatures(message.data);
        } else {
          console.warn('Expected array but got:', typeof message.data);
          setFeatures([]);
        }
        setLoading(false);
      } else if (message.type === 'features-error') {
        console.error('Features error:', message.error);
        setError(message.error);
        setLoading(false);
      }
    };

    // メッセージリスナーを登録
    window.api.receive('message-from-main', handleMessage);

    // クリーンアップ関数
    return () => {
      // 実際にはリスナーを削除する方法がないため、何もしない
    };
  }, [projectId]);

  // メニュー画面に戻る
  const handleBackClick = () => {
    onNavigate('menu');
  };

  // 仕様書アップロード画面に遷移
  const handleUploadClick = () => {
    onNavigate('upload');
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
    <div className="feature-list-page">
      <header className="header">
        <h1>機能一覧</h1>
      </header>

      <main className="content">
        <div className="controls">
          <button className="back-button" onClick={handleBackClick}>
            ← メニューに戻る
          </button>
          <button className="upload-button" onClick={handleUploadClick}>
            + 仕様書からの機能抽出
          </button>
        </div>

        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : error ? (
          <div className="error-message">エラー: {error}</div>
        ) : features.length === 0 ? (
          <div className="no-features">
            <p>機能がありません。仕様書をアップロードして機能を抽出してください。</p>
            <div className="debug-info">
              <p><strong>デバッグ情報:</strong></p>
              <p>projectId: {projectId || 'なし'}</p>
              <p>featuresの型: {typeof features}</p>
              <p>featuresは配列か: {Array.isArray(features) ? 'はい' : 'いいえ'}</p>
            </div>
          </div>
        ) : (
          <div className="feature-list">
            <div className="debug-info">
              <p><strong>デバッグ情報:</strong></p>
              <p>表示する機能数: {features.length}</p>
              <p>最初の機能のID: {features[0]?.id || 'なし'}</p>
            </div>
            {features.map((feature) => (
              <div
                key={feature.id}
                className="feature-card"
                onClick={() => onSelectFeature && onSelectFeature(feature)}
              >
                <h3>{feature.name}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-meta">
                  <p className="feature-date">
                    作成日時: {formatDate(feature.createdAt)}
                  </p>
                </div>
                <div className="view-details-button">詳細を表示</div>
                <ScenarioList featureId={feature.id} />
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2023 E2E Testing Application</p>
      </footer>
    </div>
  );
};

export default FeatureListPage;
