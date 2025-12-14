import { memo, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CsvUploader } from '@/components/CsvUploader';
import {
  SplitterPreview,
  type RowCutLineClickHandler,
} from '@/components/SplitterPreview';
import { useDownload } from '@/hooks/useDownload';
import { useTheme } from '@/hooks/useTheme';
import { useCutter } from '@/hooks/useCutter';
import { Download, Upload, Sun, Moon, Monitor } from 'lucide-react';

function App() {
  const [originalFilename, setOriginalFilename] = useState<string | null>(null);
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
    processData,
    reset: resetCutter,
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
    setNumberOfColumnsToCut(null);
  };

  const handleDownload = () => {
    if (!originalData) return;

    // 処理が実行できない場合は元のデータをダウンロード
    const canProcess =
      rowIndexToCut !== null ||
      numberOfColumnsToCut !== null ||
      (localRowsPerFile !== null && localRowsPerFile > 0 && localRowsPerFile < originalData.rows.length);

    if (!canProcess) {
      const filename = originalFilename || 'data.csv';
      downloadCsv(originalData.rows, filename);
      return;
    }

    // 処理を実行
    const result = processData(
      rowIndexToCut ?? 0,
      numberOfColumnsToCut,
      localRowsPerFile !== null && localRowsPerFile > 0 ? localRowsPerFile : null,
      includeHeader
    );

    if (!result) return;

    // 分割されたファイルをダウンロード
    if (Array.isArray(result)) {
      const baseFilename = originalFilename
        ? originalFilename.replace(/\.csv$/i, '')
        : 'split';
      const files = result.map((data, index) => ({
        rows: data.rows,
        filename: `${baseFilename}_${index + 1}.csv`,
      }));
      downloadMultiple(files, originalFilename || 'split');
    } else {
      // 単一ファイルをダウンロード
      const filename = originalFilename
        ? originalFilename.replace(/\.csv$/i, '_processed.csv')
        : 'processed.csv';
      downloadCsv(result.rows, filename);
    }
  };

  const handleReset = () => {
    resetCutter();
    setOriginalFilename(null);
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
              <h2 className="text-lg font-bold">サイダン</h2>
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
                    const value = e.target.value === '' ? null : Number.parseInt(e.target.value) || null;
                    setLocalRowsPerFile(value);
                  }}
                  placeholder="100"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHeader"
                  checked={includeHeader}
                  onCheckedChange={(checked) => setIncludeHeader(checked === true)}
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
