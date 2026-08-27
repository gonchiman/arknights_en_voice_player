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

カタログには、公開ゲームデータから抽出した通常入手可能な407名のオペレーターと15,311件のボイスを収録しています。そのうち13,338件は英語音声を再生できます。配信元に対応音声がない1,973件は`NO AUDIO`として表示し、対応ブラウザでは英文の音声合成を利用できます。

オペレーター情報と英語・日本語テキストは[ArknightsGamedata](https://github.com/ArknightsAssets/ArknightsGamedata)、音声は[Arknights Audio](https://github.com/PseudoMon/arknights-audio)の公開データを使用しています。音声はネットワーク経由で再生し、取得できない場合は対応ブラウザの英語音声合成へ切り替えられます。ゲーム音声はリポジトリへ複製していません。

全レアリティのオペレーターカタログと音声データは次のコマンドで再生成できます。既存8名の内部IDは、お気に入りと学習履歴の互換性を保つため維持されます。

```bash
npm run generate:voices
```

生成済みカタログと音声データの整合性は次のコマンドで検証できます。必須項目の欠損、重複ID、不正な音声パスなどを通信なしで検出します。

```bash
npm run validate:voices
```

全13,338件の音声URLをネットワーク経由で検証する場合は、負荷と所要時間を確認したうえで次を実行します。

```bash
npm run validate:voices:audio
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

上記コマンドでOxlint、クラウド同期・音声検証ロジックの自動テスト、生成データの構造検証、TypeScript、Viteの本番ビルドをまとめて実行します。

## 技術構成

- React 19
- TypeScript
- Vite
- React Router（GitHub Pagesでも動作しやすいHash Router）
- Supabase Auth・PostgreSQL・Row Level Security
- CSSによるレスポンシブUI

## 注意

非公式の学習・非商用プロトタイプです。ゲーム名、キャラクター、音声などの権利は各権利者に帰属します。
