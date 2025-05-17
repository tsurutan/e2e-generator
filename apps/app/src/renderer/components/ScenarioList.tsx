import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';

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
  alwaysExpanded?: boolean;
}

const ScenarioList: React.FC<ScenarioListProps> = ({ featureId, alwaysExpanded = false }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(alwaysExpanded);

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

  if (!expanded && !alwaysExpanded) {
    return (
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleExpanded}
          className="w-full"
        >
          シナリオを表示 ({scenarios.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">シナリオ一覧</h4>
        {!alwaysExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-7 px-2"
          >
            閉じる
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4 text-muted-foreground text-sm">読み込み中...</div>
      ) : error ? (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">エラー: {error}</div>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <p>シナリオがありません。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="border rounded-md p-3 bg-card/50">
              <h4 className="font-medium mb-1">{scenario.title}</h4>
              {scenario.description && (
                <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
              )}
              <div className="space-y-2 text-sm">
                <div className="bg-muted/30 p-2 rounded">
                  <span className="font-semibold text-primary">Given:</span> {scenario.given}
                </div>
                <div className="bg-muted/30 p-2 rounded">
                  <span className="font-semibold text-primary">When:</span> {scenario.when}
                </div>
                <div className="bg-muted/30 p-2 rounded">
                  <span className="font-semibold text-primary">Then:</span> {scenario.then}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>作成日時: {formatDate(scenario.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScenarioList;
