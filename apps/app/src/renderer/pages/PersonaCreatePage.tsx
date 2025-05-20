import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../contexts/AppContext';

const PersonaCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { project, handlePersonaCreate, apiStatus } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // プロジェクトが選択されていない場合はプロジェクト一覧に戻る
  useEffect(() => {
    if (!project || !project.id) {
      navigate('/projects');
    }
  }, [project, navigate]);

  // APIの状態を監視
  useEffect(() => {
    // メインプロセスからの応答を受信
    const handleMessage = (message: any) => {
      if (message.type === 'persona-save-success') {
        // 保存成功時にペルソナ一覧に戻る
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
    if (isValidPassword(e.target.value)) {
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

    if (!password) {
      setPasswordError('パスワードを入力してください');
      isValid = false;
    } else if (!isValidPassword(password)) {
      setPasswordError('パスワードは8文字以上である必要があります');
      isValid = false;
    }

    if (!isValid) return;

    // ペルソナを作成
    if (project && project.id) {
      handlePersonaCreate(name, email, password, project.id);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-primary text-primary-foreground p-5 shadow-md">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold m-0">ペルソナ作成</h1>
        </div>
      </header>

      <main className="flex-1 p-6 flex justify-center items-start">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>新規ペルソナ</CardTitle>
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
                <Label htmlFor="persona-password">パスワード</Label>
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
                  {apiStatus?.loading ? '保存中...' : '作成'}
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
      </main>
    </div>
  );
};

export default PersonaCreatePage;
