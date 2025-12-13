# AGENTS.md

このドキュメントは、開発者やAIエージェントがこのプロジェクトを理解し、効率的に作業するための情報を提供します。

## プロジェクト概要

**saidan（裁断）** は、CSVファイルのカラム削除と行分割を行うWebアプリケーションです。ブラウザ上で完全に動作し、サーバーサイドの処理は不要です。

## アーキテクチャ

### 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **CSV処理**: PapaParse
- **デプロイ**: Docker + nginx

### ディレクトリ構造

```
src/
├── components/
│   ├── ui/              # shadcn/uiコンポーネント（自動生成）
│   ├── CsvUploader.tsx  # CSVアップロードコンポーネント
│   ├── ColumnCutter.tsx # カラム削除（裁断）コンポーネント
│   ├── RowSplitter.tsx  # 行分割コンポーネント
│   └── PreviewTable.tsx # プレビューテーブルコンポーネント
├── hooks/
│   ├── useCsvProcessor.ts # CSV処理ロジック（カスタムフック）
│   └── useDownload.ts     # ダウンロード処理（カスタムフック）
└── lib/
    └── utils.ts          # ユーティリティ関数（cn関数など）
```

### コンポーネント命名規則

- コンポーネントは **PascalCase** で命名（例: `PreviewTable`, `ColumnCutter`）
- ファイル名はコンポーネント名と同じ（例: `PreviewTable.tsx`）

### 状態管理

- React Hooks（useState, useCallback）を使用
- グローバル状態管理ライブラリは使用していない
- 親コンポーネント（App.tsx）で主要な状態を管理

### 主要な機能フロー

1. **CSVアップロード**
   - `CsvUploader` コンポーネントでファイルを選択
   - `useCsvProcessor` フックでPapaParseを使用してパース
   - パース結果を `App.tsx` の状態に保存

2. **カラム削除**
   - `ColumnCutter` コンポーネントでカラム間の線を選択
   - 選択された線より右側のカラムを削除
   - 処理結果を `App.tsx` の `processedData` に保存

3. **行分割**
   - `RowSplitter` コンポーネントで行数を指定
   - 指定行数ごとにデータを分割
   - 分割結果を `App.tsx` の `splitData` に保存

4. **ダウンロード**
   - `useDownload` フックでCSVを生成
   - 単一ファイルまたは複数ファイルを順次ダウンロード

## 開発方針

### 作業プロセス

**重要**: このプロジェクトでは、ステップごとに確認を取りながら作業を進めます。

1. 各主要機能の実装が完了したら、ユーザーに確認を取る
2. 一度に全てを実装せず、段階的に機能を追加していく
3. 各ステップで動作確認を行い、問題があれば修正してから次に進む

### shadcn/uiコンポーネントの追加

新しいshadcn/uiコンポーネントが必要な場合は、コマンドでインストールしてください：

```bash
pnpm dlx shadcn@latest add <component-name>
```

手動でコンポーネントを作成しないでください。

### スタイリング

- Tailwind CSSを使用
- shadcn/uiのデザインシステムに従う
- カスタムスタイルは `src/index.css` に追加

### CSV処理

- PapaParseを使用してCSVのパースと生成を行う
- エラーハンドリングを適切に実装
- 大きなファイルでもブラウザで処理可能な実装を心がける

### ダウンロード機能

- ZIP化は行わない（ユーザー要求）
- 複数ファイルの場合は、順次ダウンロード（200ms間隔）
- `useDownload` フックで実装

## Docker設定

### ビルドプロセス

1. **Build stage**: Node.jsでViteビルドを実行
2. **Production stage**: nginxで静的ファイルを配信

### nginx設定

- SPAルーティング対応（全てのルートでindex.htmlを返す）
- 静的アセットのキャッシュ設定
- Gzip圧縮有効化
- セキュリティヘッダー設定

## トラブルシューティング

### 開発サーバーが起動しない

- `pnpm install` を実行して依存関係を再インストール
- `node_modules` を削除してから再インストール

### ビルドエラー

- TypeScriptの型エラーを確認
- `pnpm build` でエラーメッセージを確認

### Dockerビルドエラー

- `.dockerignore` で不要なファイルが除外されているか確認
- `docker compose build --no-cache` でキャッシュなしで再ビルド

## 今後の拡張可能性

- カラムの並び替え機能
- フィルタリング機能
- 複数ファイルの一括処理
- 処理履歴の保存
- エクスポート形式の追加（JSON, Excel等）

## 参考リンク

- [shadcn/ui](https://ui.shadcn.com/)
- [PapaParse](https://www.papaparse.com/)
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)

