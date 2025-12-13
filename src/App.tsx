import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CsvUploader } from '@/components/CsvUploader'
import { SplitterPreview } from '@/components/SplitterPreview'
import { SettingsDialog } from '@/components/SettingsDialog'
import { useDownload } from '@/hooks/useDownload'
import { useTheme } from '@/hooks/useTheme'
import { useCutter } from '@/hooks/useCutter'
import { Download, Upload, Sun, Moon, Monitor, Scissors, RotateCcw } from 'lucide-react'

function App() {
  const [originalFilename, setOriginalFilename] = useState<string | null>(null)
  const [localRowCutCount, setLocalRowCutCount] = useState<number>(0)
  const [isRowCutSelected, setIsRowCutSelected] = useState<boolean>(false)
  const [numberOfColumnsToCut, setNumberOfColumnsToCut] = useState<number|null>(null)
  const [localRowsPerFile, setLocalRowsPerFile] = useState<number>(100)
  const { downloadCsv, downloadMultiple } = useDownload()
  const { theme, setTheme } = useTheme()
  const {
    originalData,
    rowCutData,
    columnCutData,
    rowSplitData,
    setRowsPerFile,
    setData,
    cutRows,
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

  const handleCsvLoaded = (data: { rows: string[][] }, filename: string) => {
    setData(data)
    setOriginalFilename(filename)
    // 1ファイルあたりの行数の初期値を入力ファイルの行数に設定
    const initialRowsPerFile = data.rows.length
    setRowsPerFile(initialRowsPerFile)
    setLocalRowsPerFile(initialRowsPerFile)
    setLocalRowCutCount(0)
    setNumberOfColumnsToCut(null)
  }

  const handleDownload = () => {
    if (rowSplitData && rowSplitData.length > 0) {
      // 分割されたファイルをダウンロード
      const baseFilename = originalFilename 
        ? originalFilename.replace(/\.csv$/i, '')
        : 'split'
      const files = rowSplitData.map((data, index) => ({
        rows: data.rows,
        filename: `${baseFilename}_${index + 1}.csv`,
      }))
      downloadMultiple(files, originalFilename || 'split')
    } else if (columnCutData || rowCutData) {
      // カラム削除または行カット後のファイルをダウンロード
      const dataToDownload = columnCutData || rowCutData
      if (dataToDownload) {
        const filename = originalFilename 
          ? originalFilename.replace(/\.csv$/i, '_processed.csv')
          : 'processed.csv'
        downloadCsv(dataToDownload.rows, filename)
      }
    } else if (originalData) {
      // 処理が実行されていない場合は元のデータをダウンロード
      const filename = originalFilename || 'data.csv'
      downloadCsv(originalData.rows, filename)
    }
  }

  const handleReset = () => {
    resetCutter()
    setOriginalFilename(null)
    setLocalRowCutCount(0)
    setNumberOfColumnsToCut(null)
  }

  const handleRevert = () => {
    revert()
    setNumberOfColumnsToCut(null)
    setLocalRowCutCount(0)
    setIsRowCutSelected(false)
  }

  const handleRowCutLineClick = () => {
    // ハサミアイコンをクリックしたときの処理（選択状態を切り替え）
    setIsRowCutSelected(prev => !prev)
  }

  const handleSaidan = () => {
    const shouldCutRows = localRowCutCount > 0
    const shouldCutColumns = numberOfColumnsToCut !== null && numberOfColumnsToCut > 0
    const shouldSplitRows = localRowsPerFile && localRowsPerFile > 0

    // 行カットを実行
    if (shouldCutRows) {
      cutRows(localRowCutCount)
    }

    // カラムカットを実行
    if (shouldCutColumns) {
      cutColumns(new Set([numberOfColumnsToCut]))
    }

    // 行分割を実行
    if (shouldSplitRows) {
      splitRows(localRowsPerFile)
    }
  }

  const getSaidanButtonDisabled = () => {
    // すべての処理が実行できない場合は無効
    return localRowCutCount === 0 && numberOfColumnsToCut === 0 && (!localRowsPerFile || localRowsPerFile <= 0)
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
            <div className="space-y-4 flex-1">
              {originalData && (
                <Card>
                  <CardContent>
                    <SplitterPreview
                      rows={originalData.rows}
                      numberOfColumnsToCut={numberOfColumnsToCut}
                      numberOfRowsToCut={localRowCutCount}
                      isRowCutSelected={isRowCutSelected}
                      onColumnCutLineClick={(index) => setNumberOfColumnsToCut(index + 1)}
                      onRowCutLineClick={handleRowCutLineClick}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* フォーム（画面下部） */}
            {originalData && !columnCutData && !rowCutData && !rowSplitData && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="rowCutCount" className="block text-sm font-medium mb-2">
                        最初の行をカット
                      </label>
                      <Input
                        id="rowCutCount"
                        type="number"
                        min="0"
                        max={originalData.rows.length}
                        value={localRowCutCount}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 0
                          const newValue = Math.max(0, Math.min(value, originalData.rows.length))
                          setLocalRowCutCount(newValue)
                          // 行カット数が変更されたら選択状態をリセット
                          if (newValue === 0) {
                            setIsRowCutSelected(false)
                          }
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label htmlFor="rowsPerFile" className="block text-sm font-medium mb-2">
                        1ファイルあたりの行数
                      </label>
                      <Input
                        id="rowsPerFile"
                        type="number"
                        min="1"
                        value={localRowsPerFile}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 0
                          setLocalRowsPerFile(value)
                        }}
                        placeholder="100"
                      />
                    </div>
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* アクションボタン */}
            {(columnCutData || rowCutData || rowSplitData) && (
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
        )}

      </div>
    </div>
  )
}

export default App
