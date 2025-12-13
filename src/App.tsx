import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CsvUploader } from '@/components/CsvUploader'
import { ColumnCutter } from '@/components/ColumnCutter'
import { RowSplitter } from '@/components/RowSplitter'
import { SettingsDialog } from '@/components/SettingsDialog'
import { useDownload } from '@/hooks/useDownload'
import { useTheme } from '@/hooks/useTheme'
import { useCutter } from '@/hooks/useCutter'
import { Download, Upload, Sun, Moon, Monitor } from 'lucide-react'

function App() {
  const [originalFilename, setOriginalFilename] = useState<string | null>(null)
  const { downloadCsv, downloadMultiple } = useDownload()
  const { theme, setTheme } = useTheme()
  const {
    originalData,
    columnCutData,
    rowSplitData,
    currentData,
    rowsPerFile,
    setData,
    cutColumns,
    splitRows,
    reset: resetCutter,
  } = useCutter()

  const handleThemeToggle = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getThemeIcon = () => {
    if (theme === 'light') {
      return <Sun className="h-5 w-5" />
    } else if (theme === 'dark') {
      return <Moon className="h-5 w-5" />
    } else {
      return <Monitor className="h-5 w-5" />
    }
  }

  const handleCsvLoaded = (data: { headers: string[]; rows: string[][] }, filename: string) => {
    setData(data)
    setOriginalFilename(filename)
  }

  const handleDownload = () => {
    if (rowSplitData && rowSplitData.length > 0) {
      // 分割されたファイルをダウンロード
      const baseFilename = originalFilename 
        ? originalFilename.replace(/\.csv$/i, '')
        : 'split'
      const files = rowSplitData.map((data, index) => ({
        headers: data.headers,
        rows: data.rows,
        filename: `${baseFilename}_${index + 1}.csv`,
      }))
      downloadMultiple(files, originalFilename || 'split')
    } else if (columnCutData) {
      // カラム削除後のファイルをダウンロード
      const filename = originalFilename 
        ? originalFilename.replace(/\.csv$/i, '_processed.csv')
        : 'processed.csv'
      downloadCsv(columnCutData.headers, columnCutData.rows, filename)
    } else if (originalData) {
      // カラム削除が実行されていない場合は元のデータをダウンロード
      const filename = originalFilename || 'data.csv'
      downloadCsv(originalData.headers, originalData.rows, filename)
    }
  }

  const handleReset = () => {
    resetCutter()
    setOriginalFilename(null)
  }

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
              onClick={handleThemeToggle}
              title={`テーマ: ${theme === 'light' ? 'ライト' : theme === 'dark' ? 'ダーク' : 'システム'}`}
            >
              {getThemeIcon()}
              <span className="sr-only">テーマ切替</span>
            </Button>
            <SettingsDialog />
          </div>
        </div>

        {!originalData ? (
          <CsvUploader onCsvLoaded={handleCsvLoaded} />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                ファイル: {originalData.headers.length} カラム, {originalData.rows.length} 行
              </p>
            </div>

            <Tabs defaultValue="column" className="w-full">
              <TabsList className="mx-auto h-14 rounded-full p-1">
                <TabsTrigger value="column" className="rounded-full px-8 py-3 text-base">タテ</TabsTrigger>
                <TabsTrigger value="split" className="rounded-full px-8 py-3 text-base">ヨコ</TabsTrigger>
              </TabsList>
              <TabsContent value="column" className="mt-4">
                {currentData && (
                  <ColumnCutter
                    headers={currentData.headers}
                    rows={currentData.rows}
                    onCutColumns={cutColumns}
                  />
                )}
              </TabsContent>
              <TabsContent value="split" className="mt-4">
                {currentData && (
                  <RowSplitter
                    headers={currentData.headers}
                    rows={currentData.rows}
                    rowsPerFile={rowsPerFile}
                    splitData={rowSplitData}
                    onSplitRows={splitRows}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* フローティングボタン */}
        {originalData && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex flex-row gap-3 p-4 rounded-full backdrop-blur-md bg-background/80 border border-border/50 shadow-lg">
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="rounded-full transition-shadow bg-background/50"
              >
                <Upload className="mr-2 h-5 w-5" />
                別のファイルを編集
              </Button>
              {originalData && (
                <Button
                  onClick={handleDownload}
                  variant="default"
                  size="lg"
                  className="rounded-full transition-shadow"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {rowSplitData && rowSplitData.length > 0
                    ? `${rowSplitData.length}個のファイルをダウンロード`
                    : 'ダウンロード'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
