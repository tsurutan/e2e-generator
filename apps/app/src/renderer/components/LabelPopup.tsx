import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[400px] max-w-[90%]">
        <h3 className="text-lg font-semibold mb-4">ラベル登録</h3>
        <div className="bg-muted/50 p-3 rounded mb-4 font-mono text-sm break-all">
          <div className="mb-1"><span className="font-semibold">要素:</span> {elementInfo.selector}</div>
          {elementInfo.text && <div><span className="font-semibold">テキスト:</span> {elementInfo.text}</div>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label-name">名前</Label>
            <Input
              id="label-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ラベル名を入力"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label-description">説明</Label>
            <Textarea
              id="label-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="説明を入力（任意）"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
            <Button type="submit">
              保存
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabelPopup;
