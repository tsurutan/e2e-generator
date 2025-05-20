import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAppContext, Persona } from '../contexts/AppContext';
import { Trash2, Edit, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const PersonaListPage: React.FC = () => {
  const navigate = useNavigate();
  const { project, personas, setPersonas, setSelectedPersona, handlePersonaDelete } = useAppContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);

  // プロジェクトが選択されていない場合はプロジェクト一覧に戻る
  useEffect(() => {
    if (!project || !project.id) {
      navigate('/projects');
    }
  }, [project, navigate]);

  // ペルソナ一覧を取得
  useEffect(() => {
    if (!project || !project.id) return;

    setLoading(true);
    setError(null);

    // メインプロセスにペルソナ一覧取得リクエストを送信
    window.api.send('get-personas', { projectId: project.id });

    // メインプロセスからの応答を受信
    const handleMessage = (message: any) => {
      if (message.type === 'personas-loaded') {
        setPersonas(message.data);
        setLoading(false);
      } else if (message.type === 'personas-error') {
        setError(message.error);
        setLoading(false);
      } else if (message.type === 'persona-delete-success') {
        // 削除成功時に一覧を更新
        window.api.send('get-personas', { projectId: project.id });
      }
    };

    // メッセージリスナーを登録
    window.api.receive('message-from-main', handleMessage);

    // クリーンアップ関数
    return () => {
      // 実際にはリスナーを削除する方法がないため、何もしない
    };
  }, [project, setPersonas]);

  // メニュー画面に戻る
  const handleBackClick = () => {
    navigate('/menu');
  };

  // 新規ペルソナ作成画面に遷移
  const handleCreatePersona = () => {
    navigate('/create-persona');
  };

  // ペルソナ編集画面に遷移
  const handleEditPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    navigate(`/edit-persona/${persona.id}`);
  };

  // ペルソナ削除確認ダイアログを表示
  const handleDeleteClick = (persona: Persona) => {
    setPersonaToDelete(persona);
    setDeleteDialogOpen(true);
  };

  // ペルソナ削除を実行
  const confirmDelete = () => {
    if (personaToDelete && personaToDelete.id) {
      handlePersonaDelete(personaToDelete.id);
      setDeleteDialogOpen(false);
    }
  };

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground p-5 shadow-md">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold m-0">ペルソナ一覧</h1>
          <Button onClick={handleCreatePersona} className="bg-white text-primary hover:bg-gray-100">
            <Plus className="mr-2 h-4 w-4" /> 新規ペルソナ
          </Button>
        </div>
      </header>

      <main className="flex-1 p-5 overflow-auto">
        <div className="mb-5">
          <Button
            variant="outline"
            onClick={handleBackClick}
            className="flex items-center gap-1"
          >
            <span className="mr-1">←</span> メニューに戻る
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">読み込み中...</div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">エラー: {error}</div>
        ) : personas.length === 0 ? (
          <div className="text-center py-10 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">ペルソナがありません。新規ペルソナを作成してください。</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {personas.map((persona) => (
              <Card
                key={persona.id}
                className="hover:shadow-md transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{persona.name}</h3>
                      <p className="text-sm text-muted-foreground">{persona.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPersona(persona)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(persona)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-4">
                    <p>作成日時: {formatDate(persona.createdAt || '')}</p>
                    <p>更新日時: {formatDate(persona.updatedAt || '')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ペルソナを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は元に戻せません。{personaToDelete?.name} を削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PersonaListPage;
