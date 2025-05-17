import React, { useState, useEffect } from 'react';
import { PageType } from '../App';
import '../styles/ProjectListPage.css';

interface Project {
  id: string;
  name: string;
  url: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectListPageProps {
  onNavigate: (page: PageType) => void;
  onSelectProject?: (project: Project) => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ onNavigate, onSelectProject }) => {
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
    if (onSelectProject) {
      onSelectProject(project);
    }
    // メニュー画面に戻る
    onNavigate('menu');
  };

  // 新規プロジェクト作成画面に遷移
  const handleCreateProject = () => {
    onNavigate('project-create');
  };

  // メニュー画面に戻る
  const handleBackClick = () => {
    onNavigate('menu');
  };

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="project-list-page">
      <header className="header">
        <h1>プロジェクト一覧</h1>
      </header>

      <main className="content">
        <div className="controls">
          <button className="back-button" onClick={handleBackClick}>
            ← メニューに戻る
          </button>
          <button className="create-button" onClick={handleCreateProject}>
            + 新規プロジェクト
          </button>
        </div>

        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : error ? (
          <div className="error-message">エラー: {error}</div>
        ) : projects.length === 0 ? (
          <div className="no-projects">
            <p>プロジェクトがありません。新規プロジェクトを作成してください。</p>
          </div>
        ) : (
          <div className="project-list">
            {projects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => handleProjectClick(project)}
              >
                <h3>{project.name}</h3>
                <p className="project-url">{project.url}</p>
                {project.description && <p>{project.description}</p>}
                <p className="project-date">
                  作成日時: {formatDate(project.createdAt)}
                </p>
                <p className="project-date">
                  更新日時: {formatDate(project.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2023 E2E Testing Application</p>
      </footer>
    </div>
  );
};

export default ProjectListPage;
