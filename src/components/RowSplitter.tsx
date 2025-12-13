import { useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PreviewTable } from './PreviewTable'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface RowSplitterProps {
  headers: string[]
  rows: string[][]
  rowsPerFile: number
  splitData: Array<{ headers: string[]; rows: string[][] }> | null
  onSplitRows: (rowsPerFile: number) => void
}

export function RowSplitter({ headers, rows, rowsPerFile, splitData, onSplitRows }: RowSplitterProps) {
  const [localRowsPerFile, setLocalRowsPerFile] = useState<number>(rowsPerFile)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // rowsPerFileが変更されたらローカル状態を更新
  useEffect(() => {
    setLocalRowsPerFile(rowsPerFile)
  }, [rowsPerFile])

  const handleSplit = useCallback(() => {
    if (localRowsPerFile <= 0) {
      alert('1以上の数値を入力してください')
      return
    }

    onSplitRows(localRowsPerFile)
    setCurrentPage(1) // 分割実行時にページを1にリセット
  }, [localRowsPerFile, onSplitRows])

  // ページネーション用のページ番号リストを生成
  const pageNumbers = useMemo(() => {
    if (!splitData) return []
    
    const totalPages = splitData.length
    const maxVisiblePages = 7 // 表示する最大ページ数
    
    if (totalPages <= maxVisiblePages) {
      // ページ数が少ない場合は全て表示
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    // ページ数が多い場合のロジック
    const pages: (number | 'ellipsis')[] = []
    
    if (currentPage <= 4) {
      // 最初の方にいる場合
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('ellipsis')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      // 最後の方にいる場合
      pages.push(1)
      pages.push('ellipsis')
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 中間にいる場合
      pages.push(1)
      pages.push('ellipsis')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push('ellipsis')
      pages.push(totalPages)
    }
    
    return pages
  }, [splitData, currentPage])

  const handlePreviousPage = useCallback(() => {
    if (splitData && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [splitData, currentPage])

  const handleNextPage = useCallback(() => {
    if (splitData && currentPage < splitData.length) {
      setCurrentPage(currentPage + 1)
    }
  }, [splitData, currentPage])

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
                value={localRowsPerFile}
                onChange={(e) => setLocalRowsPerFile(Number.parseInt(e.target.value) || 0)}
                placeholder="100"
              />
            </div>
            <Button onClick={handleSplit}>サイダン！</Button>
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
          <div>
            {/* ページネーション（カードの上） */}
            <div className="mb-4 flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                aria-label="前のページ"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {pageNumbers.map((page, index) => {
                if (page === 'ellipsis') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  )
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className="rounded-full w-10 h-10"
                    onClick={() => setCurrentPage(page)}
                    aria-label={`ページ ${page} に移動`}
                  >
                    {page}
                  </Button>
                )
              })}
              
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10"
                onClick={handleNextPage}
                disabled={currentPage === splitData.length}
                aria-label="次のページ"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <PreviewTable headers={splitData[currentPage - 1].headers} rows={splitData[currentPage - 1].rows} />
          </div>
        </div>
      )}

      {!splitData && (
        <PreviewTable headers={headers} rows={rows} />
      )}
    </div>
  )
}

