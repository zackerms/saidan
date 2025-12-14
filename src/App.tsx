import { memo, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CsvUploader } from '@/components/CsvUploader';
import {
  SplitterPreview,
  type RowCutLineClickHandler,
} from '@/components/SplitterPreview';
import { useDownload } from '@/hooks/useDownload';
import { useTheme } from '@/hooks/useTheme';
import { useCutter, type ProcessedData } from '@/hooks/useCutter';
import {
  Download,
  Upload,
  Scissors,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

function App() {
  const [originalFilename, setOriginalFilename] = useState<string | null>(null);
  const [rowIndexToDisplay, setRowIndexToDisplay] = useState<number>(0);
  const [rowIndexToCut, setRowIndexToCut] = useState<number | null>(null);
  const [numberOfColumnsToCut, setNumberOfColumnsToCut] = useState<
    number | null
  >(null);
  const [localRowsPerFile, setLocalRowsPerFile] = useState<number>(100);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null
  );
  const { downloadCsv, downloadMultiple } = useDownload();
  const {
    originalData,
    setData,
    processData,
    reset: resetCutter,
    revert,
  } = useCutter();

  const handleOnRowIndexToDisplayChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!originalData) return;
      const value = Number.parseInt(e.target.value) || 0;
      const newValue = Math.max(0, Math.min(value, originalData.rows.length));
      setRowIndexToDisplay(newValue);
    },
    [originalData]
  );

  const handleCsvLoaded = (data: { rows: string[][] }, filename: string) => {
    setData(data);
    setOriginalFilename(filename);
    // 1ファイルあたりの行数の初期値を入力ファイルの行数に設定
    const initialRowsPerFile = data.rows.length;
    setLocalRowsPerFile(initialRowsPerFile);
    setNumberOfColumnsToCut(null);
    setProcessedData(null);
  };

  const handleDownload = () => {
    if (!processedData) {
      // 処理が実行されていない場合は元のデータをダウンロード
      if (originalData) {
        const filename = originalFilename || 'data.csv';
        downloadCsv(originalData.rows, filename);
      }
      return;
    }

    // 分割されたファイルをダウンロード
    if (Array.isArray(processedData)) {
      const baseFilename = originalFilename
        ? originalFilename.replace(/\.csv$/i, '')
        : 'split';
      const files = processedData.map((data, index) => ({
        rows: data.rows,
        filename: `${baseFilename}_${index + 1}.csv`,
      }));
      downloadMultiple(files, originalFilename || 'split');
    } else {
      // 単一ファイルをダウンロード
      const filename = originalFilename
        ? originalFilename.replace(/\.csv$/i, '_processed.csv')
        : 'processed.csv';
      downloadCsv(processedData.rows, filename);
    }
  };

  const handleReset = () => {
    resetCutter();
    setOriginalFilename(null);
    setNumberOfColumnsToCut(null);
    setRowIndexToDisplay(0);
    setRowIndexToCut(null);
    setProcessedData(null);
  };

  const handleRevert = () => {
    revert();
    setNumberOfColumnsToCut(null);
    setRowIndexToCut(null);
    setRowIndexToDisplay(0);
    setProcessedData(null);
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

  const handleSaidan = () => {
    const result = processData(
      rowIndexToCut ?? 0,
      numberOfColumnsToCut,
      localRowsPerFile > 0 ? localRowsPerFile : null
    );
    setProcessedData(result);
  };

  const getSaidanButtonDisabled = () => {
    // すべての処理が実行できない場合は無効
    return (
      rowIndexToCut === null &&
      numberOfColumnsToCut === 0 &&
      (!localRowsPerFile || localRowsPerFile <= 0)
    );
  };

  if (!originalData) {
    return (
      <Layout>
        <CsvUploader onCsvLoaded={handleCsvLoaded} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="space-y-4 flex-1">
          <Card>
            <CardContent className="space-y-4">
              <SplitterPreview
                rows={originalData.rows}
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
                  max={originalData.rows.length}
                  value={rowIndexToDisplay}
                  onChange={handleOnRowIndexToDisplayChange}
                  placeholder="0"
                  className="flex-1 text-right"
                />
                <label htmlFor="rowCutCount">行目から表示</label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フォーム（画面下部） */}
        <Card>
          <CardContent className="pt-6">
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
                  value={localRowsPerFile}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value) || 0;
                    setLocalRowsPerFile(value);
                  }}
                  placeholder="100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div>
              {!processedData ? (
                <>
                  <div className="flex flex-row gap-2 w-full">
                    <Button
                      onClick={handleRevert}
                      variant="outline"
                      size="lg"
                      className="flex-1 rounded-full"
                    >
                      <RotateCcw className="mr-2 h-5 w-5" />
                      もとに戻す
                    </Button>
                    <Button
                      onClick={handleSaidan}
                      disabled={getSaidanButtonDisabled()}
                      variant="default"
                      size="lg"
                      className="flex-1 rounded-full"
                    >
                      <Scissors className="mr-2 h-5 w-5" />
                      サイダン！
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleDownload}
                    variant="default"
                    size="lg"
                    className="w-full rounded-full"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {Array.isArray(processedData) && processedData.length > 0
                      ? `${processedData.length}個のファイルをダウンロード`
                      : 'ダウンロード'}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                    className="w-full rounded-full"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    別のファイルを編集
                  </Button>
                </>
              )}
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
