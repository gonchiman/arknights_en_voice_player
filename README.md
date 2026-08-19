# Arknights EN Voice Player

アークナイツの英語ボイスを聞き、英語・日本語テキストの確認とディクテーション学習ができるReactアプリです。

公開サイト: https://gonchiman.github.io/arknights_en_voice_player/

## 実装済みの機能

- 名前・頭文字・レアリティ・職業・職分・陣営によるオペレーター検索
- オペレーター情報と英語ボイス一覧
- 音声の再生、一時停止、シーク
- 英語テキストと表示切り替え可能な日本語訳
- オペレーター・ボイスのお気に入り
- テキストを隠したディクテーションと類似度採点
- 回答回数、平均点、習得数、直近の学習履歴
- Googleログインによるお気に入り・学習進捗の端末間同期
- 未ログイン・オフライン時の`localStorage`保存
- デスクトップ、タブレット、スマートフォン対応

## 収録データ

カタログには8名のオペレーターと296件のボイス枠を収録しています。英語音声を再生できるのは295件です。Myrtleの`CN_028 / In Battle 4`は配信元に音声ファイルがないため、欠損状態が分かるプレースホルダーを表示します。

英語・日本語テキストは[ArknightsGameData YoStar](https://github.com/Kengxxiao/ArknightsGameData_YoStar)、音声は[Arknights Audio](https://github.com/PseudoMon/arknights-audio)の公開データを使用しています。音声はネットワーク経由で再生し、取得できない場合は対応ブラウザの英語音声合成へ切り替えられます。ゲーム音声はリポジトリへ複製していません。

登録済みオペレーターの音声データは次のコマンドで再生成できます。

```bash
npm run generate:voices
```

生成済みデータと全音声URLは次のコマンドで検証できます。データ欠損、重複ID、HTTPエラー、音声以外のレスポンスを検出すると失敗します。

```bash
npm run validate:voices
```

## 開発

```bash
npm install
npm run dev
```

Googleログインとクラウド同期を有効にする場合は、[ログイン・クラウド同期の設定](docs/AUTH_SETUP.md)を参照してください。Supabase未設定時もローカル保存のみで動作します。

## 品質チェック

```bash
npm run check
```

上記コマンドでOxlint、TypeScript、Viteの本番ビルドをまとめて実行します。

## 技術構成

- React 19
- TypeScript
- Vite
- React Router（GitHub Pagesでも動作しやすいHash Router）
- Supabase Auth・PostgreSQL・Row Level Security
- CSSによるレスポンシブUI

## 注意

非公式の学習・非商用プロトタイプです。ゲーム名、キャラクター、音声などの権利は各権利者に帰属します。
