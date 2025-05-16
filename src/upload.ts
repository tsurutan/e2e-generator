// DOM Elements
const uploadForm = document.getElementById('upload-form') as HTMLFormElement;
const specificationText = document.getElementById('specification-text') as HTMLTextAreaElement;
const specificationFile = document.getElementById('specification-file') as HTMLInputElement;
const fileNameDisplay = document.getElementById('file-name') as HTMLDivElement;
const backButton = document.getElementById('back-button') as HTMLButtonElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;

// Electron API interface
interface ElectronAPI {
  send: (channel: string, data: any) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
}

// Extend Window interface
interface Window {
  api: ElectronAPI;
}

// Initialize the upload page
function initUpload(): void {
  // Display selected file name
  specificationFile?.addEventListener('change', (event) => {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      fileNameDisplay.textContent = fileInput.files[0].name;
    } else {
      fileNameDisplay.textContent = 'ファイルが選択されていません';
    }
  });
  
  // Handle form submission
  uploadForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const text = specificationText.value.trim();
    const file = specificationFile.files && specificationFile.files.length > 0 
      ? specificationFile.files[0] 
      : null;
    
    if (!text && !file) {
      alert('テキストを入力するか、ファイルを選択してください。');
      return;
    }
    
    // Prepare data for submission
    const formData: { text?: string, fileName?: string, fileType?: string } = {};
    
    if (text) {
      formData.text = text;
    }
    
    if (file) {
      formData.fileName = file.name;
      formData.fileType = file.type;
      
      // In a real application, you would read the file and send its contents
      // For this demo, we'll just acknowledge the file was selected
      console.log(`File selected: ${file.name} (${file.type})`);
    }
    
    // Send data to main process
    window.api.send('specification-upload', formData);
    
    // Show success message
    alert('仕様書が正常にアップロードされました。');
    
    // Clear form
    specificationText.value = '';
    specificationFile.value = '';
    fileNameDisplay.textContent = 'ファイルが選択されていません';
  });
  
  // Handle back button click
  backButton?.addEventListener('click', () => {
    window.api.send('go-back-to-menu', {});
  });
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initUpload);
