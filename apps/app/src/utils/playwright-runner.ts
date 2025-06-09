import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
/**
 * 生成されたPlaywrightコードを実行する
 * @param code 生成されたPlaywrightコード
 * @param scenarioId シナリオID（一意なファイル名を生成するため）
 * @returns 実行結果のログ
 */
export async function runGeneratedCode(code: string, scenarioId: string): Promise<string[]> {
  const logs: string[] = [];
  logs.push(`生成されたコードの実行を開始します...`);

  try {
    // 一時ディレクトリを作成
    const tempDir = path.join(os.tmpdir(), 'playwright-runner');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // アプリのテストディレクトリにファイルを作成
    const appDir = path.resolve(__dirname, '..');
    // apps/app/tests ディレクトリを使用する
    const testsDir = path.join(appDir, 'tests');

    // testsディレクトリが存在するか確認
    if (!fs.existsSync(testsDir)) {
      fs.mkdirSync(testsDir, { recursive: true });
    }

    // シナリオIDを使用して一意なファイル名を生成
    const testFilePath = path.join(testsDir, `scenario-${scenarioId}.spec.js`);
    logs.push(`テストファイルを作成します: ${testFilePath}`);

    // コードをファイルに書き込む
    fs.writeFileSync(testFilePath, code);
    logs.push('テストファイルの作成が完了しました');

    // Playwrightを実行
    logs.push('Playwrightを実行中...');

    // プロミスを使用してexecをラップ
    const execPromise = (command: string): Promise<{ stdout: string; stderr: string }> => {
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject({ error, stdout, stderr });
            return;
          }
          resolve({ stdout, stderr });
        });
      });
    };

    // Playwrightを実行（ヘッドレスモードを無効化）
    // playwright.config.jsが存在するディレクトリを指定
    const command = `cd ${appDir} && npx playwright test ${path.relative(appDir, testFilePath)} --config dist/playwright.config.js --headed`;
    logs.push(`実行コマンド: ${command}`);

    try {
      const { stdout, stderr } = await execPromise(command);
      logs.push('実行結果:');
      if (stdout) {
        logs.push(stdout);
      }
      if (stderr) {
        logs.push(`エラー出力: ${stderr}`);
      }

      // テストが成功した場合は成功メッセージを追加
      logs.push('テストが正常に完了しました。');
    } catch (execError: unknown) {
      logs.push(`実行中にエラーが発生しました:`);

      // 詳細なエラー情報を収集
      let errorMessage = '';
      let stackTrace = '';

      if (typeof execError === 'object' && execError !== null) {
        const err = execError as { stdout?: string; stderr?: string; error?: Error };
        if (err.stdout) {
          logs.push(err.stdout);
        }
        if (err.stderr) {
          logs.push(`エラー出力: ${err.stderr}`);
          errorMessage += err.stderr;
        }
        if (err.error) {
          logs.push(`エラーメッセージ: ${err.error.message}`);
          errorMessage += err.error.message;
          if (err.error.stack) {
            stackTrace = err.error.stack;
            logs.push(`スタックトレース: ${err.error.stack}`);
          }
        }
      } else {
        const errString = String(execError);
        logs.push(`エラー詳細: ${errString}`);
        errorMessage = errString;
      }

      // エラー情報をスローする
      const error = new Error(errorMessage);
      error.stack = stackTrace;
      throw error;
    }

    logs.push('シナリオの実行が完了しました');
    return logs;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logs.push(`エラーが発生しました: ${errorMessage}`);
    return logs;
  }
}
