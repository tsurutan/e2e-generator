import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAppContext } from '../contexts/AppContext';

interface Project {
  id: string;
  name: string;
  url: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  featureCount?: number;
}

interface ProjectListPageProps {}

const ProjectListPage: React.FC<ProjectListPageProps> = () => {
  const navigate = useNavigate();
  const { handleSelectProject } = useAppContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // プロジェクト一覧を取得
  useEffect(() => {
    setLoading(true);
    setError(null);

    // メインプロセスにプロジェクト一覧取得リクエストを送信
    window.api.send('get-projects', {});

    // メインプロセスからの応答を受信
    const handleMessage = (message: any) => {
      if (message.type === 'projects-loaded') {
        setProjects(message.data);
        setLoading(false);
      } else if (message.type === 'projects-error') {
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
  }, []);

  // プロジェクトカードをクリックしたときの処理
  const handleProjectClick = (project: Project) => {
    handleSelectProject(project);
    // メニュー画面に戻る
    navigate('/menu');
  };

  // 新規プロジェクト作成画面に遷移
  const handleCreateProject = () => {
    navigate('/create-project');
  };

  // メニュー画面に戻る
  const handleBackClick = () => {
    navigate('/menu');
  };

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // プロジェクトを選択
  const handleProjectSelect = (project: Project) => {
    handleSelectProject(project);
    navigate('/menu');
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground p-5 shadow-md">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold m-0">プロジェクト一覧</h1>
          <Button onClick={handleCreateProject} className="bg-white text-primary hover:bg-gray-100">
            + 新規プロジェクト
          </Button>
        </div>
      </header>

      <main className="flex-1 p-5 overflow-auto">
        <div className="mb-5">
          <Button
            variant="outline"
            onClick={handleBackClick}
            className="flex items-center gap-1"
          >
            <span className="mr-1">←</span> メニューに戻る
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">読み込み中...</div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">エラー: {error}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-10 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">プロジェクトがありません。新規プロジェクトを作成してください。</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleProjectSelect(project)}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      機能数: {project.featureCount !== undefined ? project.featureCount : 0}
                    </div>
                  </div>
                  <p className="text-primary break-all text-sm mb-2">{project.url}</p>
                  {project.description && <p className="text-muted-foreground text-sm mb-3">{project.description}</p>}
                  <div className="text-xs text-muted-foreground space-y-1 border-t pt-2 mt-2">
                    <p>作成日時: {formatDate(project.createdAt)}</p>
                    <p>更新日時: {formatDate(project.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="py-3 px-4 text-center text-xs text-muted-foreground border-t">
        <p>© 2023 TestPilot</p>
      </footer>
    </div>
  );
};

export default ProjectListPage;
