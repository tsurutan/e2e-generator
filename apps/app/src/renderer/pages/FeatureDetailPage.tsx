import React, {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '../components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '../components/ui/card';
import {useAppContext, Feature, Scenario} from '../contexts/AppContext';

interface FeatureDetailPageProps {
    featureId?: string;
}

const FeatureDetailPage: React.FC<FeatureDetailPageProps> = ({featureId}) => {
    const navigate = useNavigate();
    const {selectedFeature: contextFeature, setSelectedScenario} = useAppContext();
    const [feature, setFeature] = useState<Feature | null>(contextFeature);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // 機能一覧画面に戻る
    const handleBackClick = () => {
        navigate('/features');
    };

    // 機能IDが変更されたときに機能を取得
    useEffect(() => {
        // featureIdが指定されている場合は、そのIDを使用して機能を取得
        if (featureId && (!feature || feature.id !== featureId)) {
            setLoading(true);
            setError(null);

            // APIから機能を取得
            window.api.send('get-feature', {featureId});
        }
    }, [featureId, feature]);

    // メッセージリスナーを管理するためのref
    const messageHandlerRef = useRef<((message: any) => void) | null>(null);

    // メッセージリスナーを設定
    useEffect(() => {
        // メインプロセスからの応答を受信するハンドラー
        const handleMessage = (message: any) => {
            if (message.type === 'feature-loaded') {
                // 機能データを設定
                setFeature(message.data);
            } else if (message.type === 'feature-error') {
                setError(message.error);
                setLoading(false);
            } else if (message.type === 'scenarios-loaded') {
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

        // 前回のハンドラーを保存
        messageHandlerRef.current = handleMessage;

        // メッセージリスナーを登録
        window.api.receive('message-from-main', handleMessage);

        // クリーンアップ関数
        return () => {
            // 実際にはリスナーを削除する方法がないため、何もしない
            // 将来的にリスナーを削除する方法が実装された場合は、ここで削除する
            messageHandlerRef.current = null;
        };
    }, []);

    // シナリオ一覧を取得
    useEffect(() => {
        if (!feature || !feature.id) {
            setScenarios([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // メインプロセスにシナリオ一覧取得リクエストを送信
        window.api.send('get-scenarios', {featureId: feature.id});
    }, [feature?.id]);

    // シナリオをクリックしたときの処理
    const handleScenarioClick = (scenario: Scenario) => {
        setSelectedScenario(scenario);
        navigate(`/scenarios/${scenario.id}`);
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
                <h1 className="text-2xl font-bold m-0">機能詳細</h1>
            </header>

            <main className="flex-1 p-5 overflow-auto">
                <div className="mb-5">
                    <Button
                        variant="outline"
                        onClick={handleBackClick}
                        className="flex items-center gap-1"
                    >
                        <span className="mr-1">←</span> 機能一覧に戻る
                    </Button>
                </div>

                {feature && (
                    <Card className="shadow-lg mb-6">
                        <CardHeader>
                            <CardTitle>{feature.name}</CardTitle>
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                <p>作成日時: {formatDate(feature.createdAt)}</p>
                                <p>更新日時: {formatDate(feature.updatedAt)}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium border-b pb-1 mb-3">機能説明</h3>
                                <p className="text-muted-foreground whitespace-pre-line">{feature.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {feature && (
                    <div>
                        <h3 className="text-lg font-medium border-b pb-1 mb-3">シナリオ一覧</h3>
                        <div className="bg-muted/30 rounded-md p-4">
                            {loading ? (
                                <div className="text-center py-4 text-muted-foreground text-sm">読み込み中...</div>
                            ) : error ? (
                                <div
                                    className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">エラー: {error}</div>
                            ) : scenarios.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    <p>シナリオがありません。</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {scenarios.map((scenario) => (
                                        <div
                                            key={scenario.id}
                                            className="border rounded-md p-3 bg-card/50 cursor-pointer hover:bg-muted transition-colors"
                                            onClick={() => handleScenarioClick(scenario)}
                                        >
                                            <h4 className="font-medium mb-1">{scenario.title}</h4>
                                            {scenario.description && (
                                                <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                                            )}
                                            <div className="space-y-2 text-sm">
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <span
                                                        className="font-semibold text-primary">Given:</span> {scenario.given}
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <span
                                                        className="font-semibold text-primary">When:</span> {scenario.when}
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <span
                                                        className="font-semibold text-primary">Then:</span> {scenario.then}
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
                    </div>
                )}
            </main>

            <footer className="py-3 px-4 text-center text-xs text-muted-foreground border-t">
                <p>© 2023 TestPilot</p>
            </footer>
        </div>
    );
};

export default FeatureDetailPage;
