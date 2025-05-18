import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';

interface TriggerAction {
  type: string;
  selector: string;
  text?: string;
  timestamp: string;
}

interface LabelPopupProps {
  elementInfo: {
    selector: string;
    text?: string;
    triggerActions?: TriggerAction[];
  };
  onSave: (name: string, description: string, includeTriggerActions?: boolean) => void;
  onCancel: () => void;
}

const LabelPopup: React.FC<LabelPopupProps> = ({ elementInfo, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [includeTriggerActions, setIncludeTriggerActions] = useState(true);

  // トリガーアクションが存在するかチェック
  const hasTriggerActions = elementInfo.triggerActions && elementInfo.triggerActions.length > 0;

  // アクションタイプを日本語表示に変換する関数
  const getActionTypeText = (type: string): string => {
    switch (type) {
      case 'click': return 'クリック';
      case 'input': return '入力';
      case 'submit': return '送信';
      default: return type;
    }
  };

  // タイムスタンプをフォーマットする関数
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name, description, includeTriggerActions && hasTriggerActions);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[500px] max-w-[90%] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">ラベル登録</h3>

        {/* 要素情報 */}
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

          {/* トリガーアクション情報 */}
          {hasTriggerActions && (
            <div className="mt-4">
              <Separator className="my-4" />

              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="include-trigger-actions"
                  checked={includeTriggerActions}
                  onChange={(e) => setIncludeTriggerActions((e.target as HTMLInputElement).checked)}
                />
                <Label
                  htmlFor="include-trigger-actions"
                  className="text-sm font-medium cursor-pointer"
                >
                  トリガーアクション情報を含める
                </Label>
              </div>

              <div className={`bg-muted/30 rounded p-3 text-sm ${!includeTriggerActions ? 'opacity-50' : ''}`}>
                <h4 className="font-medium mb-2">要素表示のトリガーとなったアクション：</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {elementInfo.triggerActions?.map((action, index) => (
                    <div key={index} className="bg-card border rounded p-2 text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold">{getActionTypeText(action.type)}</span>
                        <span className="text-muted-foreground">{formatTimestamp(action.timestamp)}</span>
                      </div>
                      <div className="mt-1 font-mono break-all">
                        <span className="font-medium">セレクタ:</span> {action.selector}
                      </div>
                      {action.text && (
                        <div className="mt-1">
                          <span className="font-medium">テキスト:</span> {action.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  これらのアクションは、この要素が表示されるまでに実行された操作です。
                </p>
              </div>
            </div>
          )}

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
