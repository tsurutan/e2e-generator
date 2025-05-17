import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAppContext } from '../contexts/AppContext';

interface UploadPageProps {}



// 機能インターフェース
interface Feature {
  name: string;
  description: string;
}

// 機能リストインターフェース
interface FeatureList {
  features: Feature[];
}

const UploadPage: React.FC<UploadPageProps> = () => {
  const navigate = useNavigate();
  const { project } = useAppContext();
  const projectId = project?.id;
  const projectName = project?.name;
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

  // プロジェクトIDがない場合はエラーを表示
  useEffect(() => {
    if (!projectId) {
      setError('プロジェクトが選択されていません。メニューからプロジェクトを選択してください。');
    } else {
      setError(null);
    }
  }, [projectId]);

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

    if (!projectId) {
      setError('プロジェクトが選択されていません。メニューからプロジェクトを選択してください。');
      return;
    }

    // 送信前に状態をリセット
    setFeatures([]);
    setLoading(true);
    setError(null);

    // Prepare data for submission
    const formData: { text?: string, fileName?: string, fileType?: string, projectId?: string } = {};

    if (specificationText) {
      formData.text = specificationText;
    }

    if (selectedFile) {
      formData.fileName = selectedFile.name;
      formData.fileType = selectedFile.type;

      // In a real application, you would read the file and send its contents
      console.log(`File selected: ${selectedFile.name} (${selectedFile.type})`);
    }

    // プロジェクトIDを追加
    formData.projectId = projectId;

    // Send data to main process
    window.api.send('specification-upload', formData);
  };

  // 機能を保存する処理
  const handleSaveFeatures = () => {
    if (features.length === 0) {
      setError('保存する機能がありません。');
      return;
    }

    if (!projectId) {
      setError('プロジェクトが選択されていません。メニューからプロジェクトを選択してください。');
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    // 機能にプロジェクトIDを追加する
    const featuresWithProjectId = features.map(feature => ({
      ...feature,
      projectId: projectId
    }));

    console.log('Saving features with projectId:', featuresWithProjectId);

    // メインプロセスに機能保存リクエストを送信
    window.api.send('save-features', {
      features: featuresWithProjectId,
      projectId: projectId
    });
  };

  // Handle back button click
  const handleBackClick = () => {
    navigate('/menu');
  };



  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground p-5 text-center shadow-md">
        <h1 className="text-2xl font-bold m-0">仕様書のアップロード</h1>
      </header>

      <main className="flex-1 p-5 overflow-auto">
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle>仕様書アップロード</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="upload-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>プロジェクト</Label>
                <div className="bg-muted/50 p-3 rounded text-sm font-medium">
                  {projectName ? projectName : 'プロジェクトが選択されていません'}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specification-text">仕様書のテキスト</Label>
                <Textarea
                  id="specification-text"
                  value={specificationText}
                  onChange={handleTextChange}
                  placeholder="ここに仕様書のテキストを入力してください..."
                  className="min-h-[200px]"
                />
              </div>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-muted"></div>
                <span className="mx-4 flex-shrink text-muted-foreground text-sm">または</span>
                <div className="flex-grow border-t border-muted"></div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specification-file" className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded cursor-pointer transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path>
                  </svg>
                  ファイルを選択
                </Label>
                <input
                  type="file"
                  id="specification-file"
                  onChange={handleFileChange}
                  accept=".txt,.md,.pdf,.doc,.docx"
                  className="hidden"
                />
                <div className="text-sm text-muted-foreground mt-2">
                  {selectedFile ? selectedFile.name : 'ファイルが選択されていません'}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackClick}
                >
                  戻る
                </Button>
                <Button
                  type="submit"
                  disabled={!projectId}
                >
                  送信
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {loading && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">仕様書から機能を抽出中です...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">エラーが発生しました</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {features.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>抽出された機能一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {features.map((feature, index) => (
                  <div key={index} className="bg-muted/30 p-4 rounded-md border-l-4 border-l-primary">
                    <h3 className="font-medium text-lg mb-2">{feature.name}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={() => handleSaveFeatures()}
                  disabled={!projectId || saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  機能を保存する
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/features')}
                >
                  機能一覧を表示する
                </Button>
              </div>
              {saveSuccess && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-center">
                  <p>機能が正常に保存されました。</p>
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

export default UploadPage;
