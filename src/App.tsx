import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CsvUploader } from '@/components/CsvUploader'
import { ColumnCutter } from '@/components/ColumnCutter'
import { RowSplitter } from '@/components/RowSplitter'
import { useDownload } from '@/hooks/useDownload'
import { Download } from 'lucide-react'

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
          <h1 className="text-4xl font-bold">saidan（裁断）</h1>
          <p className="text-muted-foreground">
            CSVファイルのカラム削除と行分割ができるアプリケーション
          </p>
        </div>

        {!csvData ? (
          <CsvUploader onCsvLoaded={handleCsvLoaded} />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  ファイル: {csvData.headers.length} カラム, {csvData.rows.length} 行
                </p>
              </div>
              <div className="flex gap-2">
                {(processedData || (splitData && splitData.length > 0)) && (
                  <Button onClick={handleDownload} variant="default">
                    <Download className="mr-2 h-4 w-4" />
                    {splitData && splitData.length > 0
                      ? `${splitData.length}個のファイルをダウンロード`
                      : 'ダウンロード'}
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline">
                  新しいファイルをアップロード
                </Button>
              </div>
            </div>

            <Tabs defaultValue="column" className="w-full">
              <TabsList>
                <TabsTrigger value="column">カラム削除（裁断）</TabsTrigger>
                <TabsTrigger value="split">行分割</TabsTrigger>
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
      </div>
    </div>
  )
}

export default App
