import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Play, Loader2, Code } from 'lucide-react';
import { useAppContext, Scenario } from '../contexts/AppContext';

interface ScenarioDetailPageProps {
  scenarioId?: string;
}

const ScenarioDetailPage: React.FC<ScenarioDetailPageProps> = ({ scenarioId }) => {
  const navigate = useNavigate();
  const { selectedScenario: contextScenario, selectedFeature, project } = useAppContext();
  const [scenario, setScenario] = useState<Scenario | null>(contextScenario);
  const featureName = selectedFeature?.name;
  const projectUrl = project?.url;
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // 機能詳細画面に戻る
  const handleBackClick = () => {
    if (scenario?.featureId) {
      navigate(`/features/${scenario.featureId}`);
    } else {
      navigate('/features');
    }
  };

  // scenarioIdが指定されている場合は、そのIDを使用してシナリオを取得
  useEffect(() => {
    if (scenarioId && (!scenario || scenario.id !== scenarioId)) {
      // APIからシナリオを取得する処理を実装
      // 実装例：
      // window.api.send('get-scenario', { scenarioId });
      // ここではcontextScenarioを使用
    }
  }, [scenarioId, scenario]);

  // シナリオを実行する
  const handleRunScenario = () => {
    if (!scenario) return;

    setIsRunning(true);
    setLogs([]);
    setError(null);

    // メインプロセスにシナリオ実行リクエストを送信
    window.api.send('run-scenario', {
      id: scenario.id,
      url: projectUrl || 'https://www.google.com', // プロジェクトのURLを使用する
      given: scenario.given,
      when: scenario.when,
      then: scenario.then,
      generatedCode: generatedCode // 生成されたコードがあれば使用する
    });

    // メインプロセスからの応答を受信
    const handleMessage = (message: any) => {
      if (message.type === 'scenario-run-success' && message.data.scenarioId === scenario.id) {
        setLogs(message.data.logs);
        setIsRunning(false);
      } else if (message.type === 'scenario-run-error' && message.data.scenarioId === scenario.id) {
        setError(message.error);
        setIsRunning(false);
      }
    };

    // メッセージリスナーを登録
    window.api.receive('message-from-main', handleMessage);
  };

  // Playwrightコードを生成する
  const handleGenerateCode = () => {
    if (!scenario) return;

    setIsGeneratingCode(true);
    setGeneratedCode(null);
    setCodeError(null);

    // メインプロセスにコード生成リクエストを送信
    window.api.send('generate-code', {
      id: scenario.id,
      projectUrl: projectUrl
    });

    // メインプロセスからの応答を受信
    const handleMessage = (message: any) => {
      if (message.type === 'code-generated' && message.data.scenarioId === scenario.id) {
        setGeneratedCode(message.data.code);
        setIsGeneratingCode(false);
      } else if (message.type === 'code-generation-error' && message.data?.scenarioId === scenario.id) {
        setCodeError(message.error);
        setIsGeneratingCode(false);
      }
    };

    // メッセージリスナーを登録
    window.api.receive('message-from-main', handleMessage);
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
        <h1 className="text-2xl font-bold m-0">シナリオ詳細</h1>
      </header>

      <main className="flex-1 p-5 overflow-auto">
        <div className="mb-5 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBackClick}
            className="flex items-center gap-1"
          >
            <span className="mr-1">←</span> 機能詳細に戻る
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGenerateCode}
              className="flex items-center gap-1"
              disabled={isGeneratingCode}
              title="シナリオからPlaywrightコードを生成します"
            >
              {isGeneratingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Code className="h-4 w-4" />}
              {isGeneratingCode ? '生成中...' : 'コード生成'}
            </Button>

            <Button
              variant="default"
              onClick={handleRunScenario}
              className="flex items-center gap-1"
              disabled={isRunning}
              title={generatedCode ? '生成されたコードを実行します' : 'シナリオを実行します'}
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isRunning ? '実行中...' : 'シナリオを実行'}
            </Button>
          </div>
        </div>

        {scenario && (
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <div className="mb-2 text-sm text-muted-foreground">
                {featureName && <p>機能: {featureName}</p>}
              </div>
              <CardTitle>{scenario.title}</CardTitle>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <p>作成日時: {formatDate(scenario.createdAt)}</p>
                <p>更新日時: {formatDate(scenario.updatedAt)}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {scenario.description && (
                <div>
                  <h3 className="text-lg font-medium border-b pb-1 mb-3">シナリオ説明</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{scenario.description}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium border-b pb-1 mb-3">Gherkin形式</h3>
                <div className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-md">
                    <h4 className="font-semibold text-primary mb-2">Given (前提条件)</h4>
                    <p className="whitespace-pre-line">{scenario.given}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-md">
                    <h4 className="font-semibold text-primary mb-2">When (実行するアクション)</h4>
                    <p className="whitespace-pre-line">{scenario.when}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-md">
                    <h4 className="font-semibold text-primary mb-2">Then (期待される結果)</h4>
                    <p className="whitespace-pre-line">{scenario.then}</p>
                  </div>
                </div>
              </div>

              {/* 実行結果の表示 */}
              {(logs.length > 0 || error) && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium border-b pb-1 mb-3">実行結果</h3>
                  {error ? (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                      <p>エラー: {error}</p>
                    </div>
                  ) : (
                    <div className="bg-muted/30 p-4 rounded-md font-mono text-sm whitespace-pre-line">
                      {logs.map((log, index) => (
                        <div key={index} className="py-1">{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 生成されたコードの表示 */}
              {(generatedCode || codeError) && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium border-b pb-1 mb-3">生成されたPlaywrightコード</h3>
                  {codeError ? (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                      <p>エラー: {codeError}</p>
                    </div>
                  ) : (
                    <div className="bg-muted/30 p-4 rounded-md overflow-auto">
                      <pre className="font-mono text-sm whitespace-pre">{generatedCode}</pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="py-3 px-4 text-center text-xs text-muted-foreground border-t">
        <p>© 2023 TestPilot</p>
      </footer>
    </div>
  );
};

export default ScenarioDetailPage;
