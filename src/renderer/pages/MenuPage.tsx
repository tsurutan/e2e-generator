import React from 'react';
import { PageType } from '../App';
import '../styles/MenuPage.css';

interface MenuPageProps {
  onNavigate: (page: PageType) => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ onNavigate }) => {
  // Handle feature list button click
  const handleFeaturesClick = () => {
    alert('機能一覧は現在開発中です。');
  };

  // Handle upload button click
  const handleUploadClick = () => {
    onNavigate('upload');
  };

  // Handle browser button click
  const handleBrowserClick = () => {
    onNavigate('browser');
  };

  return (
    <div className="menu-page">
      <header className="header">
        <h1>E2E Testing Application</h1>
      </header>
      
      <main className="content">
        <div className="menu-container">
          <button 
            className="menu-button" 
            onClick={handleFeaturesClick}
          >
            <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"></path>
            </svg>
            機能一覧
          </button>
          
          <button 
            className="menu-button" 
            onClick={handleUploadClick}
          >
            <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path>
            </svg>
            仕様書のアップロード
          </button>
          
          <button 
            className="menu-button" 
            onClick={handleBrowserClick}
          >
            <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"></path>
            </svg>
            ブラウザ操作
          </button>
        </div>
      </main>
      
      <footer className="footer">
        <p>© 2023 E2E Testing Application</p>
      </footer>
    </div>
  );
};

export default MenuPage;
