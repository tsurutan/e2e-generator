import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface LabelItem {
  id?: string;
  name: string;
  description: string;
  selector: string;
  elementText?: string;
  url: string;
  queryParams?: string;
  projectId: string;
}

interface LabelReviewPanelProps {
  labels: LabelItem[];
  onSave: (selectedLabels: LabelItem[]) => void;
  onCancel: () => void;
}

const LabelReviewPanel: React.FC<LabelReviewPanelProps> = ({ labels, onSave, onCancel }) => {
  // 各ラベルの選択状態と編集内容を管理
  const [labelStates, setLabelStates] = useState<{
    [key: number]: {
      selected: boolean;
      name: string;
      description: string;
    };
  }>(() => {
    // 初期状態を設定（すべて選択済み）
    const initialStates: { [key: number]: { selected: boolean; name: string; description: string } } = {};
    labels.forEach((label, index) => {
      initialStates[index] = {
        selected: true,
        name: label.name,
        description: label.description || '',
      };
    });
    return initialStates;
  });

  // すべて選択/解除の切り替え
  const toggleSelectAll = () => {
    const allSelected = Object.values(labelStates).every(state => state.selected);
    const newStates = { ...labelStates };
    
    Object.keys(newStates).forEach(key => {
      newStates[Number(key)].selected = !allSelected;
    });
    
    setLabelStates(newStates);
  };

  // 個別のラベル選択状態を切り替え
  const toggleSelect = (index: number) => {
    setLabelStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        selected: !prev[index].selected,
      },
    }));
  };

  // ラベル名を更新
  const updateName = (index: number, name: string) => {
    setLabelStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        name,
      },
    }));
  };

  // ラベル説明を更新
  const updateDescription = (index: number, description: string) => {
    setLabelStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        description,
      },
    }));
  };

  // 選択されたラベルを保存
  const handleSave = () => {
    const selectedLabels = labels
      .filter((_, index) => labelStates[index].selected)
      .map((label, index) => ({
        ...label,
        name: labelStates[index].name,
        description: labelStates[index].description,
      }));
    
    onSave(selectedLabels);
  };

  // 選択されているラベルの数
  const selectedCount = Object.values(labelStates).filter(state => state.selected).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[800px] max-w-[90%] max-h-[90vh] flex flex-col">
        <h3 className="text-lg font-semibold mb-4">自動生成されたラベル</h3>
        
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedCount} / {labels.length} 個のラベルが選択されています
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSelectAll}
          >
            {Object.values(labelStates).every(state => state.selected) 
              ? 'すべて解除' 
              : 'すべて選択'}
          </Button>
        </div>
        
        <div className="overflow-y-auto flex-1 mb-4">
          {labels.map((label, index) => (
            <div 
              key={index} 
              className={`border rounded-md p-3 mb-3 ${
                labelStates[index].selected ? 'bg-primary/5 border-primary/30' : 'bg-muted/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="pt-2">
                  <Checkbox 
                    checked={labelStates[index].selected}
                    onChange={() => toggleSelect(index)}
                    id={`label-${index}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="mb-2">
                    <Label htmlFor={`name-${index}`} className="mb-1 block">名前</Label>
                    <Input
                      id={`name-${index}`}
                      value={labelStates[index].name}
                      onChange={(e) => updateName(index, e.target.value)}
                      disabled={!labelStates[index].selected}
                    />
                  </div>
                  <div className="mb-2">
                    <Label htmlFor={`description-${index}`} className="mb-1 block">説明</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={labelStates[index].description}
                      onChange={(e) => updateDescription(index, e.target.value)}
                      disabled={!labelStates[index].selected}
                      className="min-h-[60px]"
                    />
                  </div>
                  <div className="text-xs space-y-1 border-t pt-2 mt-2">
                    <p className="font-mono break-all"><span className="font-medium">セレクタ:</span> {label.selector}</p>
                    {label.elementText && <p><span className="font-medium">テキスト:</span> {label.elementText}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-2 mt-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={selectedCount === 0}
          >
            選択したラベルを保存 ({selectedCount})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LabelReviewPanel;
