import React, { useState } from 'react';

interface LabelPopupProps {
  elementInfo: {
    selector: string;
    text?: string;
  };
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
}

const LabelPopup: React.FC<LabelPopupProps> = ({ elementInfo, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name, description);
    }
  };

  return (
    <div className="label-popup-overlay">
      <div className="label-popup">
        <h3>ラベル登録</h3>
        <div className="element-info">
          <strong>要素:</strong> {elementInfo.selector}
          {elementInfo.text && <div><strong>テキスト:</strong> {elementInfo.text}</div>}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="label-name">名前</label>
            <input
              id="label-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ラベル名を入力"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="label-description">説明</label>
            <textarea
              id="label-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="説明を入力（任意）"
            />
          </div>
          <div className="buttons">
            <button type="button" className="cancel-button" onClick={onCancel}>
              キャンセル
            </button>
            <button type="submit" className="save-button">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabelPopup;
