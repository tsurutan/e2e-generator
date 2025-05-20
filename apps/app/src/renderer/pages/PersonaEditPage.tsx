import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext, Persona } from '../contexts/AppContext';

interface PersonaEditPageProps {
  personaId?: string;
}

const PersonaEditPage: React.FC<PersonaEditPageProps> = ({ personaId }) => {
  const params = useParams();
  const id = personaId || params.personaId;
  const navigate = useNavigate();
  const { project, selectedPersona, handlePersonaUpdate, apiStatus } = useAppContext();
  const [persona, setPersona] = useState<Persona | null>(selectedPersona);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // プロジェクトが選択されていない場合はプロジェクト一覧に戻る
  useEffect(() => {
    if (!project || !project.id) {
      navigate('/projects');
    }
  }, [project, navigate]);

  // ペルソナIDが変更されたときにペルソナを取得
  useEffect(() => {
    if (id && (!persona || persona.id !== id)) {
      setLoading(true);
      setError(null);

      // APIからペルソナを取得
      window.api.send('get-persona', { personaId: id });
    }
  }, [id, persona]);

  // APIの状態を監視
  useEffect(() => {
    // メインプロセスからの応答を受信
    const handleMessage = (message: any) => {
      if (message.type === 'persona-loaded') {
        setPersona(message.data);
        setName(message.data.name);
        setEmail(message.data.email);
        setPassword(''); // パスワードは空にしておく
        setLoading(false);
      } else if (message.type === 'persona-error') {
        setError(message.error);
        setLoading(false);
      } else if (message.type === 'persona-update-success') {
        // 更新成功時にペルソナ一覧に戻る
        navigate('/personas');
      }
    };

    // メッセージリスナーを登録
    window.api.receive('message-from-main', handleMessage);

    // クリーンアップ関数
    return () => {
      // 実際にはリスナーを削除する方法がないため、何もしない
    };
  }, [navigate]);

  // 名前の入力チェック
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (e.target.value.trim()) {
      setNameError('');
    }
  };

  // メールアドレスの入力チェック
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (isValidEmail(e.target.value)) {
      setEmailError('');
    }
  };

  // パスワードの入力チェック
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (e.target.value === '' || isValidPassword(e.target.value)) {
      setPasswordError('');
    }
  };

  // メールアドレスのバリデーション
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // パスワードのバリデーション（8文字以上）
  const isValidPassword = (password: string): boolean => {
    return password.length >= 8;
  };

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    let isValid = true;

    if (!name.trim()) {
      setNameError('名前を入力してください');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('メールアドレスを入力してください');
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('有効なメールアドレスを入力してください');
      isValid = false;
    }

    // パスワードは空でもOK、入力されている場合は8文字以上
    if (password && !isValidPassword(password)) {
      setPasswordError('パスワードは8文字以上である必要があります');
      isValid = false;
    }

    if (!isValid) return;

    // ペルソナを更新
    if (persona && persona.id) {
      // パスワードが空の場合は更新しない
      if (password) {
        handlePersonaUpdate(persona.id, name, email, password);
      } else {
        handlePersonaUpdate(persona.id, name, email);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-primary text-primary-foreground p-5 shadow-md">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold m-0">ペルソナ編集</h1>
        </div>
      </header>

      <main className="flex-1 p-6 flex justify-center items-start">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">読み込み中...</div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">エラー: {error}</div>
        ) : (
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>ペルソナ編集</CardTitle>
            </CardHeader>
            <CardContent>
              <form id="persona-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="persona-name">名前</Label>
                  <Input
                    id="persona-name"
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="ペルソナの名前を入力してください"
                  />
                  {nameError && <p className="text-sm text-destructive mt-1">{nameError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="persona-email">メールアドレス</Label>
                  <Input
                    id="persona-email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="example@example.com"
                  />
                  {emailError && <p className="text-sm text-destructive mt-1">{emailError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="persona-password">パスワード（変更する場合のみ入力）</Label>
                  <Input
                    id="persona-password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="8文字以上のパスワード"
                  />
                  {passwordError && <p className="text-sm text-destructive mt-1">{passwordError}</p>}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/personas')}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    disabled={apiStatus?.loading}
                  >
                    {apiStatus?.loading ? '保存中...' : '更新'}
                  </Button>
                </div>

                {apiStatus?.error && (
                  <div className="text-destructive text-sm p-2 bg-destructive/10 rounded mt-2">
                    APIエラー: {apiStatus.error}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PersonaEditPage;
