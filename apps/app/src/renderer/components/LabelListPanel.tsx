import React from 'react';
import { Button } from './ui/button';

interface TriggerAction {
  type: string;
  selector: string;
  text?: string;
  timestamp: string;
}

interface Label {
  id: string;
  name: string;
  description?: string;
  selector: string;
  elementText?: string;
  triggerActions?: TriggerAction[];
  createdAt?: string;
}

interface LabelListPanelProps {
  labels: Label[];
  loading: boolean;
  error: string | null;
  currentUrl: string;
  onRefresh: () => void;
  onFocusElement: (selector: string) => void;
}

const LabelListPanel: React.FC<LabelListPanelProps> = ({ labels, loading, error, currentUrl, onRefresh, onFocusElement }) => {
  // 日付をフォーマット
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // アクションタイプを日本語表示に変換する関数
  const getActionTypeText = (type: string): string => {
    switch (type) {
      case 'click': return 'クリック';
      case 'input': return '入力';
      case 'submit': return '送信';
      default: return type;
    }
  };

  return (
    <div className="flex-1 p-4 bg-muted/20 border-l overflow-y-auto max-w-md flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-medium">ラベル一覧</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          title="更新"
          className="h-8 w-8 rounded-full"
        >
          <span className="text-lg">↻</span>
        </Button>
      </div>

      <div className="mb-4 p-3 bg-muted/30 rounded text-sm">
        <div className="font-medium mb-1">現在のURL:</div>
        <div className="font-mono text-xs break-all text-muted-foreground">{currentUrl}</div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          <p className="mb-2">エラー: {error}</p>
          <Button variant="outline" size="sm" onClick={onRefresh}>再試行</Button>
        </div>
      ) : labels.length === 0 ? (
        <div className="text-center py-6 bg-muted/30 rounded-md">
          <p className="text-muted-foreground mb-2">このページにはラベルがありません。</p>
          <p className="text-sm text-muted-foreground">「ラベル登録」ボタンをクリックして、ラベルを追加してください。</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {labels.map((label) => (
            <div key={label.id} className="bg-card border rounded-md p-3 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">{label.name}</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onFocusElement(label.selector)}
                  title="要素にフォーカス"
                  className="h-7 w-7 rounded-full text-primary"
                >
                  🔍
                </Button>
              </div>
              {label.description && <p className="text-sm text-muted-foreground italic mb-2">{label.description}</p>}
              <div className="text-xs space-y-1 border-t pt-2 mt-2">
                <p className="font-mono break-all"><span className="font-medium">セレクタ:</span> {label.selector}</p>
                {label.elementText && <p><span className="font-medium">テキスト:</span> {label.elementText}</p>}

                {/* トリガーアクション情報を表示 */}
                {label.triggerActions && label.triggerActions.length > 0 && (
                  <div className="mt-2 border-t pt-2">
                    <p className="font-medium text-xs mb-1">トリガーアクション:</p>
                    <div className="bg-muted/30 p-1 rounded text-[10px]">
                      {label.triggerActions.slice(0, 2).map((action, index) => (
                        <div key={index} className="mb-1 last:mb-0">
                          <span className="font-medium">{getActionTypeText(action.type)}</span>
                          <span className="text-muted-foreground ml-1">{action.selector}</span>
                        </div>
                      ))}
                      {label.triggerActions.length > 2 && (
                        <div className="text-muted-foreground">他 {label.triggerActions.length - 2} 件のアクション...</div>
                      )}
                    </div>
                  </div>
                )}

                {label.createdAt && <p className="text-muted-foreground mt-1"><span className="font-medium">作成日時:</span> {formatDate(label.createdAt)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabelListPanel;
