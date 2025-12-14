import { memo, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CsvUploader } from '@/components/CsvUploader';
import {
  SplitterPreview,
  type RowCutLineClickHandler,
} from '@/components/SplitterPreview';
import { useDownload } from '@/hooks/useDownload';
import { useTheme } from '@/hooks/useTheme';
import { useCutter } from '@/hooks/useCutter';
import { type CsvFileData } from '@/hooks/useCsvProcessor';
import {
  Download,
  Upload,
  Sun,
  Moon,
  Monitor,
  AlertCircle,
} from 'lucide-react';

function App() {
  const [originalFilesData, setOriginalFilesData] = useState<CsvFileData[]>([]);
  const [columnCountError, setColumnCountError] = useState<string | null>(null);
  const [rowIndexToDisplay, setRowIndexToDisplay] = useState<number>(0);
  const [rowIndexToCut, setRowIndexToCut] = useState<number | null>(null);
  const [numberOfColumnsToCut, setNumberOfColumnsToCut] = useState<
    number | null
  >(null);
  const [localRowsPerFile, setLocalRowsPerFile] = useState<number | null>(null);
  const [includeHeader, setIncludeHeader] = useState<boolean>(false);
  const { downloadCsv, downloadMultiple } = useDownload();
  const {
    originalData,
    setData,
    setFilesData,
    processData,
    processFilesData,
    reset: resetCutter,
  } = useCutter();

  // プレビュー用のデータ（最初のファイルのみ）
  const previewData = useMemo(() => {
    if (originalFilesData.length > 0) {
      return originalFilesData[0];
    }
    return originalData ? { rows: originalData.rows, filename: '' } : null;
  }, [originalFilesData, originalData]);

  const handleOnRowIndexToDisplayChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!previewData) return;
      const value = Number.parseInt(e.target.value) || 0;
      const newValue = Math.max(0, Math.min(value, previewData.rows.length));
      setRowIndexToDisplay(newValue);
    },
    [previewData]
  );

  // カラム数検証
  const validateColumnCounts = useCallback((files: CsvFileData[]): boolean => {
    if (files.length === 0) {
      setColumnCountError(null);
      return true;
    }

    if (files.length === 1) {
      setColumnCountError(null);
      return true;
    }

    // 最初のファイルのカラム数を取得
    const firstFile = files[0];
    if (firstFile.rows.length === 0) {
      setColumnCountError('カラム数が一致しません。');
      return false;
    }

    const firstColumnCount = firstFile.rows[0].length;
    if (firstColumnCount === 0) {
      setColumnCountError('カラム数が一致しません。');
      return false;
    }

    // 他のファイルと比較
    for (let i = 1; i < files.length; i++) {
      const currentFile = files[i];

      if (currentFile.rows.length === 0) {
        setColumnCountError('カラム数が一致しません。');
        return false;
      }

      const currentColumnCount = currentFile.rows[0].length;
      if (currentColumnCount !== firstColumnCount) {
        setColumnCountError('カラム数が一致しません。');
        return false;
      }
    }

    setColumnCountError(null);
    return true;
  }, []);

  const handleCsvLoaded = useCallback(
    (files: CsvFileData[]) => {
      // カラム数検証
      if (!validateColumnCounts(files)) {
        // エラーがある場合は、ファイルデータをクリアしてエラー表示のみ
        setOriginalFilesData([]);
        resetCutter();
        return;
      }

      // エラーをクリア
      setColumnCountError(null);

      // 複数ファイルの場合
      if (files.length > 1) {
        setOriginalFilesData(files);
        setFilesData(files);
      } else if (files.length === 1) {
        // 単一ファイルの場合（後方互換性）
        setOriginalFilesData(files);
        setFilesData(files);
        setData({ rows: files[0].rows });
      }

      setNumberOfColumnsToCut(null);
      setRowIndexToDisplay(0);
      setRowIndexToCut(null);
      setLocalRowsPerFile(null);
      setIncludeHeader(false);
    },
    [validateColumnCounts, setFilesData, setData, resetCutter]
  );

  const handleDownload = async () => {
    // 複数ファイルの場合
    if (originalFilesData.length > 0) {
      const canProcess =
        rowIndexToCut !== null ||
        numberOfColumnsToCut !== null ||
        (localRowsPerFile !== null && localRowsPerFile > 0);

      if (!canProcess) {
        // 処理が実行できない場合は元のデータをダウンロード
        await downloadMultiple(
          originalFilesData.map((file) => ({
            rows: file.rows,
            filename: file.filename,
          })),
          originalFilesData
        );
        return;
      }

      // 処理を実行
      const result = processFilesData(
        rowIndexToCut ?? 0,
        numberOfColumnsToCut,
        localRowsPerFile !== null && localRowsPerFile > 0
          ? localRowsPerFile
          : null,
        includeHeader
      );

      if (!result) return;

      if (Array.isArray(result)) {
        await downloadMultiple(result, originalFilesData);
      }
      return;
    }

    // 単一ファイルの場合（後方互換性）
    if (!originalData) return;

    const canProcess =
      rowIndexToCut !== null ||
      numberOfColumnsToCut !== null ||
      (localRowsPerFile !== null &&
        localRowsPerFile > 0 &&
        localRowsPerFile < originalData.rows.length);

    if (!canProcess) {
      downloadCsv(originalData.rows, 'data.csv');
      return;
    }

    const result = processData(
      rowIndexToCut ?? 0,
      numberOfColumnsToCut,
      localRowsPerFile !== null && localRowsPerFile > 0
        ? localRowsPerFile
        : null,
      includeHeader
    );

    if (!result) return;

    if (Array.isArray(result)) {
      const files = result.map((data, index) => ({
        rows: data.rows,
        filename: `split_${index + 1}.csv`,
      }));
      await downloadMultiple(files, []);
    } else {
      downloadCsv(result.rows, 'processed.csv');
    }
  };

  const handleReset = () => {
    resetCutter();
    setOriginalFilesData([]);
    setColumnCountError(null);
    setNumberOfColumnsToCut(null);
    setRowIndexToDisplay(0);
    setRowIndexToCut(null);
    setLocalRowsPerFile(null);
    setIncludeHeader(false);
  };

  const handleRowCutLineClick: RowCutLineClickHandler = useCallback(
    (rowIndex: number) => {
      // ハサミアイコンをクリックしたときの処理（選択状態を切り替え）
      setRowIndexToCut((prev) => {
        if (prev === rowIndex) {
          return null;
        }
        return rowIndex;
      });
    },
    []
  );

  if (originalFilesData.length === 0 && !originalData) {
    return (
      <Layout>
        <div className="flex flex-col gap-6">
          <CsvUploader onCsvLoaded={handleCsvLoaded} />
          {columnCountError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{columnCountError}</AlertDescription>
            </Alert>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {columnCountError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{columnCountError}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4 flex-1">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-lg font-bold">サイダン</h2>
              {previewData && (
                <>
                  <SplitterPreview
                    rows={previewData.rows}
                    columnIndexToCut={numberOfColumnsToCut}
                    rowIndexToDisplay={rowIndexToDisplay}
                    rowIndexToCut={rowIndexToCut}
                    onColumnCutLineClick={(index) =>
                      setNumberOfColumnsToCut(index + 1)
                    }
                    onRowCutLineClick={handleRowCutLineClick}
                  />
                  <div className="flex flex-row gap-2 justify-self-end items-center w-[200px]">
                    <Input
                      id="rowCutCount"
                      type="number"
                      min="0"
                      max={previewData.rows.length}
                      value={rowIndexToDisplay}
                      onChange={handleOnRowIndexToDisplayChange}
                      placeholder="0"
                      className="flex-1 text-right"
                    />
                    <label htmlFor="rowCutCount">行目から表示</label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* フォーム（画面下部） */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-bold">ブンカツ</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="rowsPerFile"
                  className="block text-sm font-medium mb-2"
                >
                  1ファイルあたりの行数
                </label>
                <Input
                  id="rowsPerFile"
                  type="number"
                  min="1"
                  value={localRowsPerFile ?? ''}
                  onChange={(e) => {
                    const value =
                      e.target.value === ''
                        ? null
                        : Number.parseInt(e.target.value) || null;
                    setLocalRowsPerFile(value);
                  }}
                  placeholder="100"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHeader"
                  checked={includeHeader}
                  onCheckedChange={(checked) =>
                    setIncludeHeader(checked === true)
                  }
                />
                <label
                  htmlFor="includeHeader"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  すべてのファイルにヘッダーを含める
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="space-y-2 flex flex-row gap-2 w-full">
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="flex-1 rounded-full"
              >
                <Upload className="mr-2 h-5 w-5" />
                別のファイルをサイダン
              </Button>
              <Button
                onClick={handleDownload}
                variant="default"
                size="lg"
                className="flex-1 rounded-full"
              >
                <Download className="mr-2 h-5 w-5" />
                ダウンロード
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

const Layout = memo(({ children }: { children: React.ReactNode }) => {
  const { theme, toggleTheme } = useTheme();
  const themeIcon = useMemo(() => {
    if (theme === 'light') {
      return <Sun className="h-5 w-5" />;
    } else if (theme === 'dark') {
      return <Moon className="h-5 w-5" />;
    } else {
      return <Monitor className="h-5 w-5" />;
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="text-center space-y-2 flex-1">
            <h1 className="text-4xl font-bold">saidan</h1>
          </div>
          <div className="flex-1 flex justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={toggleTheme}
              title={`テーマ: ${theme === 'light' ? 'ライト' : theme === 'dark' ? 'ダーク' : 'システム'}`}
            >
              {themeIcon}
              <span className="sr-only">テーマ切替</span>
            </Button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
});

export default App;
