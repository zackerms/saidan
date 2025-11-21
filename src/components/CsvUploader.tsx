import { useRef, useCallback, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCsvProcessor } from '@/hooks/useCsvProcessor'

interface CsvUploaderProps {
  onCsvLoaded: (data: { headers: string[]; rows: string[][] }) => void
}

export function CsvUploader({ onCsvLoaded }: CsvUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { csvData, parseCsv, error, isProcessing } = useCsvProcessor()

  useEffect(() => {
    if (csvData && !error) {
      onCsvLoaded(csvData)
    }
  }, [csvData, error, onCsvLoaded])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      alert('CSVファイルを選択してください')
      return
    }

    parseCsv(file)
  }, [parseCsv])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      alert('CSVファイルを選択してください')
      return
    }

    parseCsv(file)
  }, [parseCsv])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

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
            ファイルをドラッグ&ドロップするか、ボタンをクリックして選択
          </p>
          <Button onClick={handleButtonClick} disabled={isProcessing}>
            {isProcessing ? '処理中...' : 'ファイルを選択'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

