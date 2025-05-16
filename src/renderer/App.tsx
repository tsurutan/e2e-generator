import React, { useState } from 'react';
import MenuPage from './pages/MenuPage';
import BrowserPage from './pages/BrowserPage';
import UploadPage from './pages/UploadPage';

// Define page types
export type PageType = 'menu' | 'browser' | 'upload';

// Define Electron API interface
declare global {
  interface Window {
    api: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}

const App: React.FC = () => {
  // State to track current page
  const [currentPage, setCurrentPage] = useState<PageType>('menu');

  // Function to navigate to a different page
  const navigateTo = (page: PageType) => {
    setCurrentPage(page);
  };

  // Render the appropriate page based on currentPage state
  return (
    <>
      {currentPage === 'menu' && <MenuPage onNavigate={navigateTo} />}
      {currentPage === 'browser' && <BrowserPage onNavigate={navigateTo} />}
      {currentPage === 'upload' && <UploadPage onNavigate={navigateTo} />}
    </>
  );
};

export default App;
