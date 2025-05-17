import React, { useState, useEffect } from 'react';
import MenuPage from './pages/MenuPage';
import BrowserPage from './pages/BrowserPage';
import UploadPage from './pages/UploadPage';
import ProjectCreatePage from './pages/ProjectCreatePage';
import ProjectListPage from './pages/ProjectListPage';

// Define page types
export type PageType = 'project-create' | 'menu' | 'browser' | 'upload' | 'project-list';

// Define Electron API interface
declare global {
  interface Window {
    api: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}

// Project interface
interface Project {
  id?: string;
  name: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
}

const App: React.FC = () => {
  // State to track current page
  const [currentPage, setCurrentPage] = useState<PageType>('project-create');
  // State to store project information
  const [project, setProject] = useState<Project | null>(null);
  // State to track API operation status
  const [apiStatus, setApiStatus] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null
  });
  // State to store projects list
  const [projects, setProjects] = useState<Project[]>([]);

  // Check if project exists in localStorage on mount
  useEffect(() => {
    const savedProject = localStorage.getItem('project');
    if (savedProject) {
      try {
        const parsedProject = JSON.parse(savedProject);
        setProject(parsedProject);
        setCurrentPage('menu');
      } catch (error) {
        console.error('Failed to parse saved project:', error);
        localStorage.removeItem('project');
      }
    }
  }, []);

  // Listen for messages from the main process
  useEffect(() => {
    // Handle messages from main process
    window.api.receive('message-from-main', (message) => {
      if (message.type === 'project-save-success') {
        console.log('Project saved successfully:', message.data);
        // Update project with data from API (including ID)
        setProject(message.data);
        localStorage.setItem('project', JSON.stringify(message.data));
        setApiStatus({ loading: false, error: null });
      } else if (message.type === 'project-save-error') {
        console.error('Error saving project:', message.error);
        setApiStatus({ loading: false, error: message.error });
      } else if (message.type === 'projects-loaded') {
        console.log('Projects loaded successfully:', message.data);
        setProjects(message.data);
      } else if (message.type === 'projects-error') {
        console.error('Error loading projects:', message.error);
      }
    });
  }, []);

  // Function to navigate to a different page
  const navigateTo = (page: PageType) => {
    setCurrentPage(page);
  };

  // Function to handle project creation
  const handleProjectCreate = (name: string, url: string) => {
    const newProject = { name, url };
    setProject(newProject);
    setApiStatus({ loading: true, error: null });

    // Save to localStorage
    localStorage.setItem('project', JSON.stringify(newProject));

    // Send to main process to save to API
    window.api.send('save-project', newProject);
  };

  // Function to handle project selection from list
  const handleSelectProject = (selectedProject: Project) => {
    setProject(selectedProject);
    localStorage.setItem('project', JSON.stringify(selectedProject));
  };

  // Render the appropriate page based on currentPage state
  return (
    <>
      {currentPage === 'project-create' && (
        <ProjectCreatePage
          onNavigate={navigateTo}
          onProjectCreate={handleProjectCreate}
          apiStatus={apiStatus}
        />
      )}
      {currentPage === 'menu' && (
        <MenuPage
          onNavigate={navigateTo}
          project={project}
        />
      )}
      {currentPage === 'browser' && (
        <BrowserPage
          onNavigate={navigateTo}
          projectUrl={project?.url}
        />
      )}
      {currentPage === 'upload' && (
        <UploadPage
          onNavigate={navigateTo}
        />
      )}
      {currentPage === 'project-list' && (
        <ProjectListPage
          onNavigate={navigateTo}
          onSelectProject={handleSelectProject}
        />
      )}
    </>
  );
};

export default App;
