import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Project interface
export interface Project {
  id?: string;
  name: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
  featureCount?: number;
}

// Feature interface
export interface Feature {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string | null;
  project?: any | null;
}

// Scenario interface
export interface Scenario {
  id: string;
  title: string;
  description?: string;
  given: string;
  when: string;
  then: string;
  featureId: string;
  createdAt: string;
  updatedAt: string;
}

// Persona interface
export interface Persona {
  id?: string;
  name: string;
  email: string;
  password: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Status interface
export interface ApiStatus {
  loading: boolean;
  error: string | null;
}

// Context interface
interface AppContextType {
  project: Project | null;
  setProject: (project: Project | null) => void;
  apiStatus: ApiStatus;
  setApiStatus: (status: ApiStatus) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  selectedFeature: Feature | null;
  setSelectedFeature: (feature: Feature | null) => void;
  selectedScenario: Scenario | null;
  setSelectedScenario: (scenario: Scenario | null) => void;
  personas: Persona[];
  setPersonas: (personas: Persona[]) => void;
  selectedPersona: Persona | null;
  setSelectedPersona: (persona: Persona | null) => void;
  handleProjectCreate: (name: string, url: string) => void;
  handleSelectProject: (project: Project) => void;
  handlePersonaCreate: (name: string, email: string, password: string, projectId: string) => void;
  handlePersonaUpdate: (id: string, name?: string, email?: string, password?: string) => void;
  handlePersonaDelete: (id: string) => void;
}

// Create context with default values
const AppContext = createContext<AppContextType>({
  project: null,
  setProject: () => {},
  apiStatus: { loading: false, error: null },
  setApiStatus: () => {},
  projects: [],
  setProjects: () => {},
  selectedFeature: null,
  setSelectedFeature: () => {},
  selectedScenario: null,
  setSelectedScenario: () => {},
  personas: [],
  setPersonas: () => {},
  selectedPersona: null,
  setSelectedPersona: () => {},
  handleProjectCreate: () => {},
  handleSelectProject: () => {},
  handlePersonaCreate: () => {},
  handlePersonaUpdate: () => {},
  handlePersonaDelete: () => {},
});

// Provider props interface
interface AppProviderProps {
  children: ReactNode;
}

// Provider component
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // State to store project information
  const [project, setProject] = useState<Project | null>(null);
  // State to track API operation status
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    loading: false,
    error: null
  });
  // State to store projects list
  const [projects, setProjects] = useState<Project[]>([]);
  // State to store selected feature
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  // State to store selected scenario
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  // State to store personas list
  const [personas, setPersonas] = useState<Persona[]>([]);
  // State to store selected persona
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  // Check if project exists in localStorage on mount
  useEffect(() => {
    const savedProject = localStorage.getItem('project');
    if (savedProject) {
      try {
        const parsedProject = JSON.parse(savedProject);
        setProject(parsedProject);
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

  // Function to handle persona creation
  const handlePersonaCreate = (name: string, email: string, password: string, projectId: string) => {
    const newPersona = { name, email, password, projectId };
    setApiStatus({ loading: true, error: null });

    // Send to main process to save to API
    window.api.send('save-persona', newPersona);
  };

  // Function to handle persona update
  const handlePersonaUpdate = (id: string, name?: string, email?: string, password?: string) => {
    const updateData: any = { id };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;

    setApiStatus({ loading: true, error: null });

    // Send to main process to update in API
    window.api.send('update-persona', updateData);
  };

  // Function to handle persona deletion
  const handlePersonaDelete = (id: string) => {
    setApiStatus({ loading: true, error: null });

    // Send to main process to delete from API
    window.api.send('delete-persona', { id });
  };

  // Context value
  const value = {
    project,
    setProject,
    apiStatus,
    setApiStatus,
    projects,
    setProjects,
    selectedFeature,
    setSelectedFeature,
    selectedScenario,
    setSelectedScenario,
    personas,
    setPersonas,
    selectedPersona,
    setSelectedPersona,
    handleProjectCreate,
    handleSelectProject,
    handlePersonaCreate,
    handlePersonaUpdate,
    handlePersonaDelete,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);
