import React from 'react';

interface Label {
  id: string;
  name: string;
  description?: string;
  selector: string;
  elementText?: string;
  createdAt?: string;
}

interface LabelListPanelProps {
  labels: Label[];
  loading: boolean;
  error: string | null;
  currentUrl: string;
  onRefresh: () => void;
  onFocusElement: (selector: string) => void;
}

const LabelListPanel: React.FC<LabelListPanelProps> = ({ labels, loading, error, currentUrl, onRefresh, onFocusElement }) => {
  // 日付をフォーマット
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="label-list-sidebar">
      <div className="label-list-header">
        <h3>ラベル一覧</h3>
        <button className="refresh-button" onClick={onRefresh} title="更新">
          ↻
        </button>
      </div>

      <div className="current-url">
        <strong>現在のURL:</strong>
        <div className="url-text">{currentUrl}</div>
      </div>

      {loading ? (
        <div className="loading-labels">読み込み中...</div>
      ) : error ? (
        <div className="error-message">
          <p>エラー: {error}</p>
          <button className="retry-button" onClick={onRefresh}>再試行</button>
        </div>
      ) : labels.length === 0 ? (
        <div className="no-labels">
          <p>このページにはラベルがありません。</p>
          <p>「ラベル登録」ボタンをクリックして、ラベルを追加してください。</p>
        </div>
      ) : (
        <div className="labels-list">
          {labels.map((label) => (
            <div key={label.id} className="label-item">
              <div className="label-header">
                <h4>{label.name}</h4>
                <button
                  className="focus-button"
                  onClick={() => onFocusElement(label.selector)}
                  title="要素にフォーカス"
                >
                  <span className="focus-icon">🔍</span>
                </button>
              </div>
              {label.description && <p className="label-description">{label.description}</p>}
              <div className="label-details">
                <p><strong>セレクタ:</strong> {label.selector}</p>
                {label.elementText && <p><strong>テキスト:</strong> {label.elementText}</p>}
                {label.createdAt && <p className="label-date"><strong>作成日時:</strong> {formatDate(label.createdAt)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabelListPanel;
