import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import BrowserPage from './pages/BrowserPage';
import UploadPage from './pages/UploadPage';
import ProjectCreatePage from './pages/ProjectCreatePage';
import ProjectListPage from './pages/ProjectListPage';
import FeatureListPage from './pages/FeatureListPage';
import FeatureDetailPage from './pages/FeatureDetailPage';
import ScenarioDetailPage from './pages/ScenarioDetailPage';
import PersonaListPage from './pages/PersonaListPage';
import PersonaCreatePage from './pages/PersonaCreatePage';
import PersonaEditPage from './pages/PersonaEditPage';
import { AppProvider } from './contexts/AppContext';
import './styles/output.css';

// Define Electron API interface
declare global {
  interface Window {
    api: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}

// FeatureDetail wrapper component to handle params
const FeatureDetailWrapper: React.FC = () => {
  const { featureId } = useParams<{ featureId: string }>();
  return <FeatureDetailPage featureId={featureId} />;
};

// ScenarioDetail wrapper component to handle params
const ScenarioDetailWrapper: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  return <ScenarioDetailPage scenarioId={scenarioId} />;
};

// PersonaEdit wrapper component to handle params
const PersonaEditWrapper: React.FC = () => {
  const { personaId } = useParams<{ personaId: string }>();
  return <PersonaEditPage personaId={personaId} />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/create-project" element={<ProjectCreatePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/browser" element={<BrowserPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/features" element={<FeatureListPage />} />
          <Route path="/features/:featureId" element={<FeatureDetailWrapper />} />
          <Route path="/scenarios/:scenarioId" element={<ScenarioDetailWrapper />} />
          <Route path="/personas" element={<PersonaListPage />} />
          <Route path="/create-persona" element={<PersonaCreatePage />} />
          <Route path="/edit-persona/:personaId" element={<PersonaEditWrapper />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;
