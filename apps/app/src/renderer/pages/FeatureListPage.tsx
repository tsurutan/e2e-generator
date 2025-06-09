import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScenarioList from '../components/ScenarioList';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAppContext, Feature } from '../contexts/AppContext';

interface FeatureListPageProps {}

const FeatureListPage: React.FC<FeatureListPageProps> = () => {
  const navigate = useNavigate();
  const { project, setSelectedFeature } = useAppContext();
  const projectId = project?.id;
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
    navigate('/menu');
  };

  // 仕様書アップロード画面に遷移
  const handleUploadClick = () => {
    navigate('/upload');
  };

  // 機能を選択
  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
    navigate(`/features/${feature.id}`);
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
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground p-5 text-center shadow-md">
        <h1 className="text-2xl font-bold m-0">機能一覧</h1>
      </header>

      <main className="flex-1 p-5 overflow-auto">
        <div className="flex justify-between mb-5">
          <Button
            variant="outline"
            onClick={handleBackClick}
            className="flex items-center gap-1"
          >
            <span className="mr-1">←</span> メニューに戻る
          </Button>
          <Button onClick={handleUploadClick}>
            + 仕様書からの機能抽出
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">読み込み中...</div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">エラー: {error}</div>
        ) : features.length === 0 ? (
          <div className="text-center py-10 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground mb-4">機能がありません。仕様書をアップロードして機能を抽出してください。</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => (
                <Card
                  key={feature.id}
                  className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary"
                  onClick={() => handleFeatureClick(feature)}
                >
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold mb-2">{feature.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{feature.description}</p>
                    <div className="text-xs text-muted-foreground mb-3">
                      <p>作成日時: {formatDate(feature.createdAt)}</p>
                    </div>
                    <div className="inline-block bg-primary text-primary-foreground text-xs px-2 py-1 rounded mb-4">詳細を表示</div>
                    <ScenarioList featureId={feature.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="py-3 px-4 text-center text-xs text-muted-foreground border-t">
        <p>© 2023 TestPilot</p>
      </footer>
    </div>
  );
};

export default FeatureListPage;
