# ログイン・クラウド同期の設定

このアプリはSupabaseが未設定でも従来どおり端末内へデータを保存します。以下を設定すると、Googleログインと端末間同期が有効になります。

## 1. Supabaseプロジェクト

1. Supabaseでプロジェクトを作成します。
2. SQL Editorで`supabase/migrations/20260819000000_create_user_data.sql`を実行します。
3. Project SettingsのAPI KeysからProject URLとPublishable keyを取得します。

Secret keyおよび旧Service Role keyはブラウザへ設定しないでください。

## 2. Googleログイン

1. Google Auth PlatformでWeb applicationのOAuthクライアントを作成します。
2. Authorized JavaScript originsへ次を追加します。
   - `http://localhost:5173`
   - `https://gonchiman.github.io`
3. Authorized redirect URIsには、Supabase DashboardのAuthentication > Sign In / Providers > Googleに表示されるCallback URLを追加します。
4. GoogleのClient IDとClient SecretをSupabaseのGoogle Providerへ設定し、有効化します。
5. SupabaseのAuthentication > URL Configurationを設定します。
   - Site URL: `https://gonchiman.github.io/arknights_en_voice_player/`
   - Redirect URLs:
     - `http://localhost:5173/arknights_en_voice_player/`
     - `https://gonchiman.github.io/arknights_en_voice_player/`

## 3. ローカル開発

`.env.example`を`.env.local`へコピーし、値を設定します。

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

設定後、開発サーバーを再起動します。

```bash
npm run dev
```

## 4. GitHub Pages

GitHubリポジトリのSettings > Secrets and variables > Actions > Variablesへ次を登録します。

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`main`ブランチへ反映すると、GitHub Pagesのビルド時に自動で使用されます。

## 同期仕様

- 未ログイン時は既存の`localStorage`へ保存します。
- 初回ログイン時に端末データとクラウドデータを統合します。
- お気に入りは和集合、ディクテーション履歴は履歴IDで重複を除去します。
- 通信に失敗した変更は端末内の送信キューへ残り、次回同期時に再送します。
- ログアウト後はログインユーザーのキャッシュを画面へ表示せず、ゲスト用データへ切り替えます。
- RLSにより、ログインユーザーは自分の行だけを読み書きできます。
