import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PreviewTable } from './PreviewTable'
import { Card, CardContent } from '@/components/ui/card'

interface RowSplitterProps {
  headers: string[]
  rows: string[][]
  onSplit: (splitData: Array<{ headers: string[]; rows: string[][] }>) => void
}

export function RowSplitter({ headers, rows, onSplit }: RowSplitterProps) {
  const [rowsPerFile, setRowsPerFile] = useState<number>(100)
  const [splitData, setSplitData] = useState<Array<{ headers: string[]; rows: string[][] }> | null>(null)

  const handleSplit = useCallback(() => {
    if (rowsPerFile <= 0) {
      alert('1以上の数値を入力してください')
      return
    }

    const splits: Array<{ headers: string[]; rows: string[][] }> = []
    
    for (let i = 0; i < rows.length; i += rowsPerFile) {
      const chunk = rows.slice(i, i + rowsPerFile)
      splits.push({
        headers,
        rows: chunk,
      })
    }

    setSplitData(splits)
    onSplit(splits)
  }, [rowsPerFile, rows, headers, onSplit])

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="rowsPerFile" className="block text-sm font-medium mb-2">
                1ファイルあたりの行数
              </label>
              <Input
                id="rowsPerFile"
                type="number"
                min="1"
                value={rowsPerFile}
                onChange={(e) => setRowsPerFile(Number.parseInt(e.target.value) || 0)}
                placeholder="100"
              />
            </div>
            <Button onClick={handleSplit}>分割実行</Button>
          </div>

          {splitData && (
            <div className="mt-4 p-3 bg-muted rounded text-sm">
              {splitData.length} 個のファイルに分割されました（合計 {rows.length} 行）
            </div>
          )}
        </CardContent>
      </Card>

      {splitData && splitData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">分割結果のプレビュー</h3>
          {splitData.map((data, index) => (
            <div key={index}>
              <h4 className="text-md font-medium mb-2">ファイル {index + 1} ({data.rows.length} 行)</h4>
              <PreviewTable headers={data.headers} rows={data.rows} />
            </div>
          ))}
        </div>
      )}

      {!splitData && (
        <PreviewTable headers={headers} rows={rows} />
      )}
    </div>
  )
}

