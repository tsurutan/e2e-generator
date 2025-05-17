import React from 'react';
import { PageType, Feature } from '../App';
import ScenarioList from '../components/ScenarioList';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface FeatureDetailPageProps {
  onNavigate: (page: PageType) => void;
  feature: Feature;
}

const FeatureDetailPage: React.FC<FeatureDetailPageProps> = ({ onNavigate, feature }) => {
  // 機能一覧画面に戻る
  const handleBackClick = () => {
    onNavigate('feature-list');
  };

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '日付なし';
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '無効な日付' : date.toLocaleString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return '日付フォーマットエラー';
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground p-5 text-center shadow-md">
        <h1 className="text-2xl font-bold m-0">機能詳細</h1>
      </header>

      <main className="flex-1 p-5 overflow-auto">
        <div className="mb-5">
          <Button
            variant="outline"
            onClick={handleBackClick}
            className="flex items-center gap-1"
          >
            <span className="mr-1">←</span> 機能一覧に戻る
          </Button>
        </div>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle>{feature.name}</CardTitle>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <p>作成日時: {formatDate(feature.createdAt)}</p>
              <p>更新日時: {formatDate(feature.updatedAt)}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium border-b pb-1 mb-3">機能説明</h3>
              <p className="text-muted-foreground whitespace-pre-line">{feature.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium border-b pb-1 mb-3">シナリオ一覧</h3>
              <div className="bg-muted/30 rounded-md p-4">
                <ScenarioList featureId={feature.id} alwaysExpanded={true} />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="py-3 px-4 text-center text-xs text-muted-foreground border-t">
        <p>© 2023 E2E Testing Application</p>
      </footer>
    </div>
  );
};

export default FeatureDetailPage;
