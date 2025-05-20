import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAppContext } from '../contexts/AppContext';

interface MenuPageProps {}

const MenuPage: React.FC<MenuPageProps> = () => {
  const navigate = useNavigate();
  const { project } = useAppContext();
  // Handle feature list button click
  const handleFeaturesClick = () => {
    navigate('/features');
  };

  // Handle upload button click
  const handleUploadClick = () => {
    navigate('/upload');
  };

  // Handle browser button click
  const handleBrowserClick = () => {
    navigate('/browser');
  };

  // Handle project list button click
  const handleProjectListClick = () => {
    navigate('/projects');
  };

  // Handle personas button click
  const handlePersonasClick = () => {
    navigate('/personas');
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground p-5 text-center shadow-md">
        <h1 className="text-2xl font-bold m-0">TestPilot</h1>
        {project && (
          <div className="mt-2 text-sm bg-primary-foreground/20 py-2 px-3 rounded inline-block">
            <p className="m-0">現在のプロジェクト: <strong>{project.name}</strong> ({project.url})</p>
          </div>
        )}
      </header>

      <main className="flex-1 p-5">
        <div className="flex flex-col w-full max-w-md mx-auto gap-4">
          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full px-5 py-3 h-auto justify-start text-lg"
                onClick={handleProjectListClick}
              >
                <svg className="w-6 h-6 mr-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"></path>
                </svg>
                プロジェクト一覧
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full px-5 py-3 h-auto justify-start text-lg"
                onClick={handleFeaturesClick}
              >
                <svg className="w-6 h-6 mr-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"></path>
                </svg>
                機能一覧
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full px-5 py-3 h-auto justify-start text-lg"
                onClick={handleUploadClick}
              >
                <svg className="w-6 h-6 mr-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path>
                </svg>
                仕様書のアップロード
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full px-5 py-3 h-auto justify-start text-lg"
                onClick={handlePersonasClick}
              >
                <svg className="w-6 h-6 mr-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                </svg>
                ペルソナ管理
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full px-5 py-3 h-auto justify-start text-lg"
                onClick={handleBrowserClick}
              >
                <svg className="w-6 h-6 mr-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"></path>
                </svg>
                ブラウザ操作
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="py-3 px-4 text-center text-xs text-muted-foreground border-t">
        <p>© 2023 TestPilot</p>
      </footer>
    </div>
  );
};

export default MenuPage;
