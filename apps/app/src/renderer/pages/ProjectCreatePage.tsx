import React, { useState } from 'react';
import { PageType } from '../App';
import '../styles/ProjectCreatePage.css';

interface ProjectCreatePageProps {
  onNavigate: (page: PageType) => void;
  onProjectCreate: (projectName: string, projectUrl: string) => void;
  apiStatus?: {
    loading: boolean;
    error: string | null;
  };
}

const ProjectCreatePage: React.FC<ProjectCreatePageProps> = ({ onNavigate, onProjectCreate, apiStatus }) => {
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

    // Save project and navigate to menu
    onProjectCreate(projectName, formatURL(projectUrl));
    onNavigate('menu');
  };

  return (
    <div className="project-create-page">
      <header className="header">
        <h1>プロジェクト作成</h1>
      </header>

      <main className="content">
        <div className="form-container">
          <form id="project-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="project-name">プロジェクト名:</label>
              <input
                id="project-name"
                type="text"
                value={projectName}
                onChange={handleNameChange}
                placeholder="プロジェクト名を入力してください"
              />
              {nameError && <div className="error-message">{nameError}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="project-url">プロジェクトURL:</label>
              <input
                id="project-url"
                type="text"
                value={projectUrl}
                onChange={handleUrlChange}
                placeholder="https://www.example.com"
              />
              {urlError && <div className="error-message">{urlError}</div>}
            </div>

            <div className="button-container">
              <button
                type="submit"
                className="button submit-button"
                disabled={apiStatus?.loading}
              >
                {apiStatus?.loading ? '保存中...' : '作成'}
              </button>
            </div>

            {apiStatus?.error && (
              <div className="error-message api-error">
                APIエラー: {apiStatus.error}
              </div>
            )}
          </form>
        </div>
      </main>

      <footer className="footer">
        <p>© 2023 E2E Testing Application</p>
      </footer>
    </div>
  );
};

export default ProjectCreatePage;
