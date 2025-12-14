import { useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCsvProcessor, type CsvFileData } from '@/hooks/useCsvProcessor';

interface CsvUploaderProps {
  onCsvLoaded: (data: CsvFileData[]) => void;
}

export function CsvUploader({ onCsvLoaded }: CsvUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parseMultipleCsv, error, isProcessing } = useCsvProcessor();

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      const csvFiles = files.filter((file) => file.name.endsWith('.csv'));
      if (csvFiles.length === 0) {
        alert('CSVファイルを選択してください');
        return;
      }

      if (csvFiles.length !== files.length) {
        alert('CSVファイル以外が含まれています。CSVファイルのみ処理されます。');
      }

      try {
        const results = await parseMultipleCsv(csvFiles);
        onCsvLoaded(results);
      } catch {
        // エラーはparseMultipleCsv内で設定される
      }
    },
    [parseMultipleCsv, onCsvLoaded]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files);
      if (files.length === 0) return;

      const csvFiles = files.filter((file) => file.name.endsWith('.csv'));
      if (csvFiles.length === 0) {
        alert('CSVファイルを選択してください');
        return;
      }

      if (csvFiles.length !== files.length) {
        alert('CSVファイル以外が含まれています。CSVファイルのみ処理されます。');
      }

      try {
        const results = await parseMultipleCsv(csvFiles);
        onCsvLoaded(results);
      } catch {
        // エラーはparseMultipleCsv内で設定される
      }
    },
    [parseMultipleCsv, onCsvLoaded]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Card>
      <CardContent className="p-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors"
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">CSVファイルをアップロード</p>
          <p className="text-sm text-gray-500 mb-4">
            ファイルをドラッグ&ドロップするか、ボタンをクリックして選択（複数選択可）
          </p>
          <Button onClick={handleButtonClick} disabled={isProcessing}>
            {isProcessing ? '処理中...' : 'ファイルを選択'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
