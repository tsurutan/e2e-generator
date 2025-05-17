import React, { useState, useEffect } from 'react';
import { PageType } from '../App';
import '../styles/UploadPage.css';

interface UploadPageProps {
  onNavigate: (page: PageType) => void;
}

// 機能インターフェース
interface Feature {
  name: string;
  description: string;
}

// 機能リストインターフェース
interface FeatureList {
  features: Feature[];
}

const UploadPage: React.FC<UploadPageProps> = ({ onNavigate }) => {
  const [specificationText, setSpecificationText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Handle text area change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSpecificationText(e.target.value);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // メインプロセスからのメッセージを受信
  useEffect(() => {
    // 機能抽出の結果を受信するリスナーを設定
    const handleMessage = (message: any) => {
      if (message.type === 'features-extracted') {
        console.log('Features extracted:', message.data);
        setFeatures(message.data.features);
        setLoading(false);
        setError(null);
        setSaveSuccess(false);
      } else if (message.type === 'features-extraction-error') {
        console.error('Error extracting features:', message.error);
        setLoading(false);
        setError(message.error);
        setSaveSuccess(false);
      } else if (message.type === 'features-saved') {
        console.log('Features saved:', message.data);
        setSaving(false);
        setSaveSuccess(true);
        // 保存成功時に機能一覧を更新
        setFeatures(message.data);
      } else if (message.type === 'features-save-error') {
        console.error('Error saving features:', message.error);
        setSaving(false);
        setError(message.error);
        setSaveSuccess(false);
      }
    };

    // メッセージリスナーを登録
    window.api.receive('message-from-main', handleMessage);

    // クリーンアップ関数
    return () => {
      // 実際にはリスナーを削除する方法がないため、何もしない
    };
  }, []);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!specificationText && !selectedFile) {
      alert('テキストを入力するか、ファイルを選択してください。');
      return;
    }

    // 送信前に状態をリセット
    setFeatures([]);
    setLoading(true);
    setError(null);

    // Prepare data for submission
    const formData: { text?: string, fileName?: string, fileType?: string } = {};

    if (specificationText) {
      formData.text = specificationText;
    }

    if (selectedFile) {
      formData.fileName = selectedFile.name;
      formData.fileType = selectedFile.type;

      // In a real application, you would read the file and send its contents
      console.log(`File selected: ${selectedFile.name} (${selectedFile.type})`);
    }

    // Send data to main process
    window.api.send('specification-upload', formData);
  };

  // 機能を保存する処理
  const handleSaveFeatures = () => {
    if (features.length === 0) {
      setError('保存する機能がありません。');
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    // メインプロセスに機能保存リクエストを送信
    window.api.send('save-features', {
      features: features
    });
  };

  // Handle back button click
  const handleBackClick = () => {
    onNavigate('menu');
  };

  return (
    <div className="upload-page">
      <header className="header">
        <h1>仕様書のアップロード</h1>
      </header>

      <main className="content">
        <div className="upload-container">
          <form id="upload-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="specification-text">仕様書のテキスト:</label>
              <textarea
                id="specification-text"
                value={specificationText}
                onChange={handleTextChange}
                placeholder="ここに仕様書のテキストを入力してください..."
              />
            </div>

            <div className="or-divider">または</div>

            <div className="form-group file-upload">
              <label htmlFor="specification-file" className="file-upload-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                  <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path>
                </svg>
                ファイルを選択
              </label>
              <input
                type="file"
                id="specification-file"
                onChange={handleFileChange}
                accept=".txt,.md,.pdf,.doc,.docx"
              />
              <div className="file-name">
                {selectedFile ? selectedFile.name : 'ファイルが選択されていません'}
              </div>
            </div>

            <div className="button-container">
              <button
                type="button"
                className="button back-button"
                onClick={handleBackClick}
              >
                戻る
              </button>
              <button
                type="submit"
                className="button submit-button"
              >
                送信
              </button>
            </div>
          </form>
        </div>

        {loading && (
          <div className="result-container loading">
            <p>仕様書から機能を抽出中です...</p>
          </div>
        )}

        {error && (
          <div className="result-container error">
            <h2>エラーが発生しました</h2>
            <p>{error}</p>
          </div>
        )}

        {features.length > 0 && (
          <div className="result-container">
            <h2>抽出された機能一覧</h2>
            <div className="features-list">
              {features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <h3>{feature.name}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
            <div className="button-container save-buttons">
              <button
                type="button"
                className="button save-button"
                onClick={() => handleSaveFeatures()}
              >
                機能を保存する
              </button>
              <button
                type="button"
                className="button view-button"
                onClick={() => onNavigate('feature-list')}
              >
                機能一覧を表示する
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2023 E2E Testing Application</p>
      </footer>
    </div>
  );
};

export default UploadPage;
