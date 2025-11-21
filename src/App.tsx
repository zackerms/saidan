import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CsvUploader } from '@/components/CsvUploader'
import { ColumnCutter } from '@/components/ColumnCutter'
import { RowSplitter } from '@/components/RowSplitter'
import { useDownload } from '@/hooks/useDownload'
import { Download, Upload } from 'lucide-react'

function App() {
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [processedData, setProcessedData] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [splitData, setSplitData] = useState<Array<{ headers: string[]; rows: string[][] }> | null>(null)
  const { downloadCsv, downloadMultiple } = useDownload()

  const handleCsvLoaded = (data: { headers: string[]; rows: string[][] }) => {
    setCsvData(data)
    setProcessedData(data)
    setSplitData(null)
  }

  const handleColumnsRemoved = (newHeaders: string[], newRows: string[][]) => {
    setProcessedData({ headers: newHeaders, rows: newRows })
  }

  const handleSplit = (splits: Array<{ headers: string[]; rows: string[][] }>) => {
    setSplitData(splits)
  }

  const handleDownload = () => {
    if (splitData && splitData.length > 0) {
      // 分割されたファイルを一括ダウンロード
      const files = splitData.map((data, index) => ({
        headers: data.headers,
        rows: data.rows,
        filename: `split_${index + 1}.csv`,
      }))
      downloadMultiple(files)
    } else if (processedData) {
      // 単一ファイルをダウンロード
      downloadCsv(processedData.headers, processedData.rows, 'processed.csv')
    }
  }

  const handleReset = () => {
    setCsvData(null)
    setProcessedData(null)
    setSplitData(null)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">saidan</h1>
        </div>

        {!csvData ? (
          <CsvUploader onCsvLoaded={handleCsvLoaded} />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                ファイル: {csvData.headers.length} カラム, {csvData.rows.length} 行
              </p>
            </div>

            <Tabs defaultValue="column" className="w-full">
              <TabsList className="mx-auto h-14 rounded-full p-1">
                <TabsTrigger value="column" className="rounded-full px-8 py-3 text-base">カラム削除（裁断）</TabsTrigger>
                <TabsTrigger value="split" className="rounded-full px-8 py-3 text-base">行分割</TabsTrigger>
              </TabsList>
              <TabsContent value="column" className="mt-4">
                {processedData && (
                  <ColumnCutter
                    headers={processedData.headers}
                    rows={processedData.rows}
                    onColumnsRemoved={handleColumnsRemoved}
                  />
                )}
              </TabsContent>
              <TabsContent value="split" className="mt-4">
                {processedData && (
                  <RowSplitter
                    headers={processedData.headers}
                    rows={processedData.rows}
                    onSplit={handleSplit}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* フローティングボタン */}
        {csvData && (
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
              {(processedData || (splitData && splitData.length > 0)) && (
                <Button
                  onClick={handleDownload}
                  variant="default"
                  size="lg"
                  className="rounded-full transition-shadow"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {splitData && splitData.length > 0
                    ? `${splitData.length}個のファイルをダウンロード`
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
