import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAppContext } from '../contexts/AppContext';

interface ProjectCreatePageProps {}

const ProjectCreatePage: React.FC<ProjectCreatePageProps> = () => {
  const navigate = useNavigate();
  const { handleProjectCreate, apiStatus } = useAppContext();
  const [projectName, setProjectName] = useState('');
  const [projectUrl, setProjectUrl] = useState('https://www.google.com');
  const [nameError, setNameError] = useState('');
  const [urlError, setUrlError] = useState('');

  // Handle project name input change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
    if (e.target.value.trim()) {
      setNameError('');
    }
  };

  // Handle project URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectUrl(e.target.value);
    if (isValidUrl(e.target.value)) {
      setUrlError('');
    }
  };

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    if (url.trim() === '') return false;

    // Add https:// if not present
    let testUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      testUrl = 'https://' + url;
    }

    try {
      new URL(testUrl);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Format URL (add https:// if not present)
  const formatURL = (url: string): string => {
    if (url.trim() === '') return '';

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }

    return url;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    let isValid = true;

    if (!projectName.trim()) {
      setNameError('プロジェクト名を入力してください');
      isValid = false;
    }

    if (!isValidUrl(projectUrl)) {
      setUrlError('有効なURLを入力してください');
      isValid = false;
    }

    if (!isValid) return;

    // Save project and navigate to projects list
    handleProjectCreate(projectName, formatURL(projectUrl));
    navigate('/projects');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-primary text-primary-foreground p-5 shadow-md">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold m-0">プロジェクト作成</h1>
        </div>
      </header>

      <main className="flex-1 p-6 flex justify-center items-start">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>新規プロジェクト</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name">プロジェクト名</Label>
                <Input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={handleNameChange}
                  placeholder="プロジェクト名を入力してください"
                />
                {nameError && <p className="text-sm text-destructive mt-1">{nameError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-url">プロジェクトURL</Label>
                <Input
                  id="project-url"
                  type="text"
                  value={projectUrl}
                  onChange={handleUrlChange}
                  placeholder="https://www.example.com"
                />
                {urlError && <p className="text-sm text-destructive mt-1">{urlError}</p>}
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/projects')}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={apiStatus?.loading}
                >
                  {apiStatus?.loading ? '保存中...' : '作成'}
                </Button>
              </div>

              {apiStatus?.error && (
                <div className="text-destructive text-sm p-2 bg-destructive/10 rounded mt-2">
                  APIエラー: {apiStatus.error}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-3 px-4 text-center text-xs text-muted-foreground border-t">
        <p>© 2023 TestPilot</p>
      </footer>
    </div>
  );
};

export default ProjectCreatePage;
