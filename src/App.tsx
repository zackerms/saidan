import { useState, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CsvUploader } from '@/components/CsvUploader'
import { ColumnCutter, type ColumnCutterHandle } from '@/components/ColumnCutter'
import { RowSplitter, type RowSplitterHandle } from '@/components/RowSplitter'
import { SettingsDialog } from '@/components/SettingsDialog'
import { useDownload } from '@/hooks/useDownload'
import { useTheme } from '@/hooks/useTheme'
import { useCutter } from '@/hooks/useCutter'
import { Download, Upload, Sun, Moon, Monitor, Scissors, RotateCcw } from 'lucide-react'

function App() {
  const [originalFilename, setOriginalFilename] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('column')
  const [selectedCutLines, setSelectedCutLines] = useState<Set<number>>(new Set())
  const [localRowsPerFile, setLocalRowsPerFile] = useState<number>(100)
  const columnCutterRef = useRef<ColumnCutterHandle>(null)
  const rowSplitterRef = useRef<RowSplitterHandle>(null)
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
    revert,
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

  const handleRevert = () => {
    revert()
    setSelectedCutLines(new Set())
  }

  const handleSaidan = () => {
    if (activeTab === 'column') {
      // タテ（カラム削除）の場合
      columnCutterRef.current?.applyCuts()
    } else if (activeTab === 'split') {
      // ヨコ（行分割）の場合
      rowSplitterRef.current?.applySplit()
    }
  }

  const getSaidanButtonDisabled = () => {
    if (activeTab === 'column') {
      return selectedCutLines.size === 0
    } else if (activeTab === 'split') {
      return !localRowsPerFile || localRowsPerFile <= 0
    }
    return true
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mx-auto h-14 rounded-full p-1">
                <TabsTrigger value="column" className="rounded-full px-8 py-3 text-base">タテ</TabsTrigger>
                <TabsTrigger value="split" className="rounded-full px-8 py-3 text-base">ヨコ</TabsTrigger>
              </TabsList>
              <TabsContent value="column" className="mt-4">
                {currentData && (
                  <ColumnCutter
                    ref={columnCutterRef}
                    headers={currentData.headers}
                    rows={currentData.rows}
                    onCutColumns={cutColumns}
                    onSelectionChange={setSelectedCutLines}
                    initialSelectedCutLines={selectedCutLines}
                  />
                )}
              </TabsContent>
              <TabsContent value="split" className="mt-4">
                {currentData && (
                  <RowSplitter
                    ref={rowSplitterRef}
                    headers={currentData.headers}
                    rows={currentData.rows}
                    rowsPerFile={rowsPerFile}
                    splitData={rowSplitData}
                    onSplitRows={splitRows}
                    onRowsPerFileChange={setLocalRowsPerFile}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* フローティングボタン */}
        {(columnCutData || rowSplitData) && (
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
              <Button
                onClick={handleRevert}
                variant="outline"
                size="lg"
                className="rounded-full transition-shadow bg-background/50"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                もとに戻す
              </Button>
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
            </div>
          </div>
        )}

        {/* サイダンボタン（サイダン実行前のみ表示） */}
        {originalData && !columnCutData && !rowSplitData && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex flex-row gap-3 p-4 rounded-full backdrop-blur-md bg-background/80 border border-border/50 shadow-lg">
              <Button
                onClick={handleSaidan}
                disabled={getSaidanButtonDisabled()}
                variant="default"
                size="lg"
                className="rounded-full transition-shadow"
              >
                <Scissors className="mr-2 h-5 w-5" />
                サイダン！
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
