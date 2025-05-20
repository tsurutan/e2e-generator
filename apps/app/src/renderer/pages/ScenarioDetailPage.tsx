import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Play, Loader2, Code, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppContext, Scenario } from '../contexts/AppContext';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';

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
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [maxAttempts] = useState<number>(3);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');

  // メッセージリスナーを登録
  useEffect(() => {
    // メインプロセスからの応答を受信するハンドラー
    const handleMessage = (message: any) => {
      console.log('Received message from main process:', message);

      // シナリオ実行の成功メッセージ
      if (message.type === 'scenario-run-success' && message.data?.scenarioId === scenario?.id) {
        setLogs(message.data.logs);
        setIsRunning(false);
      }
      // シナリオ実行のエラーメッセージ
      else if (message.type === 'scenario-run-error') {
        // シナリオのIDを確認
        const messageScenarioId = message.scenarioId || message.data?.scenarioId;
        if (messageScenarioId === scenario?.id) {
          console.log('Error running scenario:', message.error);
          setError(message.error);
          setIsRunning(false);
          setTestStatus('failed');

          // 試行回数が最大値未満の場合、コードを改良して再実行
          if (attemptCount < maxAttempts) {
            console.log(`試行回数: ${attemptCount + 1}/${maxAttempts}`);
            setIsImproving(true);

            // エラー情報をAPIに送信してコードを改良
            window.api.send('improve-code', {
              id: scenario!.id,
              code: generatedCode,
              errorMessage: message.error,
              stackTrace: message.stackTrace || '',
              attemptNumber: attemptCount + 1,
              projectUrl: projectUrl
            });
          }
        }
      }
      // コード生成の成功メッセージ
      else if (message.type === 'code-generated' && message.data?.scenarioId === scenario?.id) {
        setGeneratedCode(message.data.code);
        setIsGeneratingCode(false);

        // 生成されたコードを自動的に実行する
        if (scenario) {
          handleRunGeneratedCode(message.data.code);
        }
      }
      // コード生成のエラーメッセージ
      else if (message.type === 'code-generation-error') {
        // シナリオのIDを確認
        const messageScenarioId = message.scenarioId || message.data?.scenarioId;
        if (messageScenarioId === scenario?.id) {
          console.log('Error generating code:', message.error);
          setCodeError(message.error);
          setIsGeneratingCode(false);
          setIsImproving(false);
        }
      }
      // コード改良の成功メッセージ
      else if (message.type === 'code-improved' && message.data?.scenarioId === scenario?.id) {
        setGeneratedCode(message.data.code);
        setIsImproving(false);

        // 改良されたコードを自動的に実行する
        if (scenario) {
          // 試行回数を更新
          setAttemptCount(message.data.generationAttempt);
          handleRunGeneratedCode(message.data.code);
        }
      }
      // コード改良のエラーメッセージ
      else if (message.type === 'code-improvement-error') {
        // シナリオのIDを確認
        const messageScenarioId = message.scenarioId || message.data?.scenarioId;
        if (messageScenarioId === scenario?.id) {
          console.log('Error improving code:', message.error);
          setCodeError(`コード改良中にエラーが発生しました: ${message.error}`);
          setIsImproving(false);
        }
      }
    };

    // メッセージリスナーを登録
    window.api.receive('message-from-main', handleMessage);

    // クリーンアップ関数（実際にはリスナーを削除する方法がないため、空の関数を返す）
    return () => {
      // 実際にはipcRendererのリスナーを削除する方法がないため、何もしない
      // 実際の実装では、リスナーの削除方法を提供するべき
    };
  }, [scenario]);

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

  // 生成されたコードを実行する
  const handleRunGeneratedCode = (code: string) => {
    if (!scenario) return;

    setIsRunning(true);
    setLogs([]);
    setError(null);
    setTestStatus('running');

    console.log('Sending run-scenario request with generated code for scenario:', scenario.id);

    // メインプロセスにシナリオ実行リクエストを送信
    window.api.send('run-scenario', {
      id: scenario.id,
      url: projectUrl || 'https://www.google.com', // プロジェクトのURLを使用する
      given: scenario.given,
      when: scenario.when,
      then: scenario.then,
      generatedCode: code
    });
  };

  // シナリオを実行する
  const handleRunScenario = () => {
    if (!scenario) return;

    // 試行回数をリセット
    setAttemptCount(0);
    setTestStatus('running');

    if (generatedCode) {
      // 生成済みのコードがある場合はそれを実行
      handleRunGeneratedCode(generatedCode);
    } else {
      setIsRunning(true);
      setLogs([]);
      setError(null);

      console.log('Sending run-scenario request for scenario:', scenario.id);

      // メインプロセスにシナリオ実行リクエストを送信
      window.api.send('run-scenario', {
        id: scenario.id,
        url: projectUrl || 'https://www.google.com', // プロジェクトのURLを使用する
        given: scenario.given,
        when: scenario.when,
        then: scenario.then
      });
    }

    // メッセージリスナーはコンポーネントのマウント時に登録済み
  };

  // Playwrightコードを生成する
  const handleGenerateCode = () => {
    if (!scenario) return;

    // 試行回数をリセット
    setAttemptCount(0);
    setTestStatus('idle');
    setIsGeneratingCode(true);
    setGeneratedCode(null);
    setCodeError(null);

    console.log('Sending generate-code request for scenario:', scenario.id);

    // メインプロセスにコード生成リクエストを送信
    window.api.send('generate-code', {
      id: scenario.id,
      projectUrl: projectUrl
    });

    // メッセージリスナーはコンポーネントのマウント時に登録済み
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

              {/* テスト実行ステータスの表示 */}
              {testStatus !== 'idle' && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium border-b pb-1 mb-3">テスト実行ステータス</h3>
                  <div className="space-y-4">
                    {/* 試行回数と進捗バーの表示 */}
                    {attemptCount > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">試行回数: {attemptCount}/{maxAttempts}</span>
                          {testStatus === 'running' && <span className="text-sm text-blue-500">実行中...</span>}
                          {testStatus === 'success' && <span className="text-sm text-green-500">成功</span>}
                          {testStatus === 'failed' && attemptCount >= maxAttempts && <span className="text-sm text-red-500">失敗</span>}
                        </div>
                        <Progress value={(attemptCount / maxAttempts) * 100} className="h-2" />
                      </div>
                    )}

                    {/* 実行ステータスのアラート表示 */}
                    {testStatus === 'success' && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertTitle className="text-green-700">テスト成功</AlertTitle>
                        <AlertDescription className="text-green-600">
                          シナリオのテストが正常に完了しました。
                        </AlertDescription>
                      </Alert>
                    )}

                    {testStatus === 'failed' && attemptCount >= maxAttempts && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertTitle className="text-red-700">テスト失敗</AlertTitle>
                        <AlertDescription className="text-red-600">
                          {maxAttempts}回試行しましたが、テストは失敗しました。詳細なエラー情報を確認してください。
                        </AlertDescription>
                      </Alert>
                    )}

                    {isImproving && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        <AlertTitle className="text-blue-700">コード改良中</AlertTitle>
                        <AlertDescription className="text-blue-600">
                          エラー情報を分析し、より堅牢なテストコードを生成しています...
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}

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
