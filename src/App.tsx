import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [selectedCutLines, setSelectedCutLines] = useState<Set<number>>(new Set())
  const [localRowsPerFile, setLocalRowsPerFile] = useState<number>(100)
  const [pendingRowSplit, setPendingRowSplit] = useState<boolean>(false)
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
    setRowsPerFile,
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
    // 1ファイルあたりの行数の初期値を入力ファイルの行数に設定
    const initialRowsPerFile = data.rows.length
    setRowsPerFile(initialRowsPerFile)
    setLocalRowsPerFile(initialRowsPerFile)
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

  // タテの処理完了後にヨコの処理を実行
  useEffect(() => {
    if (pendingRowSplit && columnCutData && localRowsPerFile && localRowsPerFile > 0) {
      // 次のレンダリングサイクルで実行
      const timeoutId = setTimeout(() => {
        rowSplitterRef.current?.applySplit()
        setPendingRowSplit(false)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [columnCutData, pendingRowSplit, localRowsPerFile])

  const handleSaidan = () => {
    const shouldCutColumns = selectedCutLines.size > 0
    const shouldSplitRows = localRowsPerFile && localRowsPerFile > 0

    if (shouldCutColumns) {
      // タテ（カラム削除）を実行
      columnCutterRef.current?.applyCuts()
      // ヨコの処理も必要なら、タテの完了を待つ
      if (shouldSplitRows) {
        setPendingRowSplit(true)
      }
    } else if (shouldSplitRows) {
      // タテの処理が不要な場合は、すぐにヨコの処理を実行
      rowSplitterRef.current?.applySplit()
    }
  }

  const getSaidanButtonDisabled = () => {
    // タテもヨコも実行できない場合は無効
    return selectedCutLines.size === 0 && (!localRowsPerFile || localRowsPerFile <= 0)
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
          <div className="flex flex-col gap-6">
            {/* 左側: プレビューテーブル */}
            <div className="space-y-4 flex-1">
              {currentData && (
                <Card>
                  <CardContent className="pt-6">
                    <ColumnCutter
                      ref={columnCutterRef}
                      headers={currentData.headers}
                      rows={currentData.rows}
                      onCutColumns={cutColumns}
                      onSelectionChange={setSelectedCutLines}
                      initialSelectedCutLines={selectedCutLines}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 右側: コントロールパネル */}
            <div className="space-y-4">
              {/* ヨコセクション */}
              <Card>
                <CardContent>
                  {currentData && (
                    <RowSplitter
                      ref={rowSplitterRef}
                      rowsPerFile={rowsPerFile}
                      onSplitRows={splitRows}
                      onRowsPerFileChange={setLocalRowsPerFile}
                    />
                  )}
                  {originalData && !columnCutData && !rowSplitData && (
                    <Button
                      onClick={handleSaidan}
                      disabled={getSaidanButtonDisabled()}
                      variant="default"
                      size="lg"
                      className="w-full rounded-full mt-4"
                    >
                      <Scissors className="mr-2 h-5 w-5" />
                      サイダン！
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* アクションボタン */}
              {(columnCutData || rowSplitData) && (
                <Card>
                  <CardContent>
                    <div className="space-y-3">
                      <Button
                        onClick={handleDownload}
                        variant="default"
                        size="lg"
                        className="w-full rounded-full"
                      >
                        <Download className="mr-2 h-5 w-5" />
                        {rowSplitData && rowSplitData.length > 0
                          ? `${rowSplitData.length}個のファイルをダウンロード`
                          : 'ダウンロード'}
                      </Button>
                      <Button
                        onClick={handleRevert}
                        variant="outline"
                        size="lg"
                        className="w-full rounded-full"
                      >
                        <RotateCcw className="mr-2 h-5 w-5" />
                        もとに戻す
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
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
