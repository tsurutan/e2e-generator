import React, { useState } from 'react';
import { PageType } from '../App';
import '../styles/UploadPage.css';

interface UploadPageProps {
  onNavigate: (page: PageType) => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ onNavigate }) => {
  const [specificationText, setSpecificationText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle text area change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSpecificationText(e.target.value);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!specificationText && !selectedFile) {
      alert('テキストを入力するか、ファイルを選択してください。');
      return;
    }
    
    // Prepare data for submission
    const formData: { text?: string, fileName?: string, fileType?: string } = {};
    
    if (specificationText) {
      formData.text = specificationText;
    }
    
    if (selectedFile) {
      formData.fileName = selectedFile.name;
      formData.fileType = selectedFile.type;
      
      // In a real application, you would read the file and send its contents
      console.log(`File selected: ${selectedFile.name} (${selectedFile.type})`);
    }
    
    // Send data to main process
    window.api.send('specification-upload', formData);
    
    // Show success message
    alert('仕様書が正常にアップロードされました。');
    
    // Clear form
    setSpecificationText('');
    setSelectedFile(null);
    
    // Optional: navigate back to menu
    // onNavigate('menu');
  };

  // Handle back button click
  const handleBackClick = () => {
    onNavigate('menu');
  };

  return (
    <div className="upload-page">
      <header className="header">
        <h1>仕様書のアップロード</h1>
      </header>
      
      <main className="content">
        <div className="upload-container">
          <form id="upload-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="specification-text">仕様書のテキスト:</label>
              <textarea 
                id="specification-text" 
                value={specificationText}
                onChange={handleTextChange}
                placeholder="ここに仕様書のテキストを入力してください..."
              />
            </div>
            
            <div className="or-divider">または</div>
            
            <div className="form-group file-upload">
              <label htmlFor="specification-file" className="file-upload-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                  <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path>
                </svg>
                ファイルを選択
              </label>
              <input 
                type="file" 
                id="specification-file" 
                onChange={handleFileChange}
                accept=".txt,.md,.pdf,.doc,.docx" 
              />
              <div className="file-name">
                {selectedFile ? selectedFile.name : 'ファイルが選択されていません'}
              </div>
            </div>
            
            <div className="button-container">
              <button 
                type="button" 
                className="button back-button"
                onClick={handleBackClick}
              >
                戻る
              </button>
              <button 
                type="submit" 
                className="button submit-button"
              >
                送信
              </button>
            </div>
          </form>
        </div>
      </main>
      
      <footer className="footer">
        <p>© 2023 E2E Testing Application</p>
      </footer>
    </div>
  );
};

export default UploadPage;
