import { useState, useCallback } from 'react'
import { Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PreviewTable } from './PreviewTable'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ColumnCutterProps {
  headers: string[]
  rows: string[][]
  onColumnsRemoved: (newHeaders: string[], newRows: string[][]) => void
}

export function ColumnCutter({ headers, rows, onColumnsRemoved }: ColumnCutterProps) {
  const [selectedCutLines, setSelectedCutLines] = useState<Set<number>>(new Set())

  const handleCutLineClick = useCallback((index: number) => {
    setSelectedCutLines(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }, [])

  const applyCuts = useCallback(() => {
    if (selectedCutLines.size === 0) {
      return
    }

    // 選択された線のインデックスから、削除するカラムのインデックスを計算
    // 線のインデックスが i の場合、カラム i を削除（線の直前のカラム）
    // 例: a-b間の線（インデックス0）を選択 → カラムa（インデックス0）を削除
    const columnsToRemove = new Set<number>()
    selectedCutLines.forEach(cutLineIndex => {
      // cutLineIndex のカラムを削除（線の直前のカラム）
      columnsToRemove.add(cutLineIndex)
    })

    // 新しいヘッダーと行を作成
    const newHeaders = headers.filter((_, index) => !columnsToRemove.has(index))
    const newRows = rows.map(row => row.filter((_, index) => !columnsToRemove.has(index)))

    onColumnsRemoved(newHeaders, newRows)
    setSelectedCutLines(new Set())
  }, [selectedCutLines, headers, rows, onColumnsRemoved])

  const resetSelection = useCallback(() => {
    setSelectedCutLines(new Set())
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>カラム削除（裁断）</CardTitle>
          <CardDescription>
            カラム間の線にマウスを合わせてクリックすると、その線より右側のカラムが削除されます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex items-center gap-2 p-4 border rounded-lg bg-background">
              {headers.map((header, index) => (
                <div key={index} className="flex items-center">
                  <div className="px-3 py-2 bg-muted rounded border min-w-[100px] text-center">
                    {header}
                  </div>
                  {index < headers.length - 1 && (
                    <div className="relative">
                      <div
                        className={`h-12 w-1 mx-1 cursor-pointer transition-all ${
                          selectedCutLines.has(index)
                            ? 'bg-red-500'
                            : 'bg-border hover:bg-primary'
                        }`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.width = '4px'
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedCutLines.has(index)) {
                            e.currentTarget.style.width = '4px'
                          }
                        }}
                        onClick={() => handleCutLineClick(index)}
                        title="クリックして裁断"
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Scissors className="h-6 w-6 text-primary" />
                        </div>
                        {selectedCutLines.has(index) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Scissors className="h-6 w-6 text-red-500 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={applyCuts} disabled={selectedCutLines.size === 0}>
              裁断を適用
            </Button>
            <Button variant="outline" onClick={resetSelection} disabled={selectedCutLines.size === 0}>
              選択をリセット
            </Button>
          </div>

          {selectedCutLines.size > 0 && (
            <div className="mt-4 p-3 bg-muted rounded text-sm">
              {Array.from(selectedCutLines).sort((a, b) => a - b).map((lineIndex, idx) => (
                <span key={lineIndex}>
                  {idx > 0 && ', '}
                  {headers[lineIndex]} と {headers[lineIndex + 1]} の間
                </span>
              ))}
              の線が選択されています。これらの線の直前のカラム（
              {Array.from(selectedCutLines).sort((a, b) => a - b).map((lineIndex, idx) => (
                <span key={lineIndex}>
                  {idx > 0 && ', '}
                  {headers[lineIndex]}
                </span>
              ))}
              ）が削除されます。
            </div>
          )}
        </CardContent>
      </Card>

      <PreviewTable headers={headers} rows={rows} />
    </div>
  )
}

