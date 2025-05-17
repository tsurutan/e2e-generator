import React, { useState, useEffect } from 'react';
import '../styles/ScenarioList.css';

// シナリオインターフェース
interface Scenario {
  id: string;
  title: string;
  description?: string;
  given: string;
  when: string;
  then: string;
  featureId: string;
  createdAt: string;
  updatedAt: string;
}

interface ScenarioListProps {
  featureId: string;
}

const ScenarioList: React.FC<ScenarioListProps> = ({ featureId }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  // シナリオ一覧を取得
  useEffect(() => {
    if (!featureId) {
      setScenarios([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // メインプロセスにシナリオ一覧取得リクエストを送信
    window.api.send('get-scenarios', { featureId });

    // メインプロセスからの応答を受信
    const handleMessage = (message: any) => {
      if (message.type === 'scenarios-loaded') {
        // APIからのレスポンスが配列か確認
        if (Array.isArray(message.data)) {
          setScenarios(message.data);
        } else {
          console.warn('Expected array but got:', typeof message.data);
          setScenarios([]);
        }
        setLoading(false);
      } else if (message.type === 'scenarios-error') {
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
  }, [featureId]);

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

  // 表示/非表示を切り替え
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (!expanded) {
    return (
      <div className="scenario-list-collapsed">
        <button className="toggle-button" onClick={toggleExpanded}>
          シナリオを表示 ({scenarios.length})
        </button>
      </div>
    );
  }

  return (
    <div className="scenario-list">
      <div className="scenario-list-header">
        <h4>シナリオ一覧</h4>
        <button className="toggle-button" onClick={toggleExpanded}>
          閉じる
        </button>
      </div>

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : error ? (
        <div className="error-message">エラー: {error}</div>
      ) : scenarios.length === 0 ? (
        <div className="no-scenarios">
          <p>シナリオがありません。</p>
        </div>
      ) : (
        <div className="scenarios">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="scenario-card">
              <h4>{scenario.title}</h4>
              {scenario.description && (
                <p className="scenario-description">{scenario.description}</p>
              )}
              <div className="scenario-steps">
                <div className="scenario-step">
                  <span className="step-keyword">Given:</span> {scenario.given}
                </div>
                <div className="scenario-step">
                  <span className="step-keyword">When:</span> {scenario.when}
                </div>
                <div className="scenario-step">
                  <span className="step-keyword">Then:</span> {scenario.then}
                </div>
              </div>
              <div className="scenario-meta">
                <p className="scenario-date">
                  作成日時: {formatDate(scenario.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScenarioList;
