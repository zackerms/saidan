import { useState, useCallback, useRef, useEffect } from 'react'
import { Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSound } from '@/hooks/useSound'
import { useSoundSetting } from '@/hooks/useSoundSetting'

interface ColumnCutterProps {
  headers: string[]
  rows: string[][]
  onColumnsRemoved: (newHeaders: string[], newRows: string[][]) => void
}

export function ColumnCutter({ headers, rows, onColumnsRemoved }: ColumnCutterProps) {
  const [selectedCutLines, setSelectedCutLines] = useState<Set<number>>(new Set())
  const [animatingLines, setAnimatingLines] = useState<Set<number>>(new Set())
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null)
  const [columnPositions, setColumnPositions] = useState<Map<number, number>>(new Map())
  const tableRef = useRef<HTMLDivElement>(null)
  const headerRefs = useRef<Map<number, HTMLTableCellElement>>(new Map())
  const maxRows = 10
  const displayRows = rows.slice(0, maxRows)
  const { playSound } = useSound()
  const { isEnabled: isSoundEnabled } = useSoundSetting()

  // カラムの位置を計算
  useEffect(() => {
    const updatePositions = () => {
      const positions = new Map<number, number>()
      headerRefs.current.forEach((element, index) => {
        if (element && tableRef.current) {
          const tableContainer = tableRef.current.querySelector('table')
          if (tableContainer) {
            const elementRect = element.getBoundingClientRect()
            const containerRect = tableContainer.getBoundingClientRect()
            // テーブルコンテナ内の相対位置を計算
            positions.set(index, elementRect.right - containerRect.left)
          }
        }
      })
      setColumnPositions(positions)
    }

    // 少し遅延させてから位置を計算（レンダリング後に）
    const timeoutId = setTimeout(updatePositions, 0)
    window.addEventListener('resize', updatePositions)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePositions)
    }
  }, [headers, displayRows])

  const handleCutLineClick = useCallback((index: number) => {
    setSelectedCutLines(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
        setAnimatingLines(prevAnim => {
          const newAnimSet = new Set(prevAnim)
          newAnimSet.delete(index)
          return newAnimSet
        })
      } else {
        newSet.add(index)
        setAnimatingLines(prevAnim => {
          const newAnimSet = new Set(prevAnim)
          newAnimSet.add(index)
          return newAnimSet
        })
        // アニメーション終了後にanimatingLinesから削除
        setTimeout(() => {
          setAnimatingLines(prevAnim => {
            const newAnimSet = new Set(prevAnim)
            newAnimSet.delete(index)
            return newAnimSet
          })
        }, 1000) // アニメーション時間に合わせる
        // 音声を再生（設定が有効な場合のみ）
        if (isSoundEnabled) {
          playSound('/sounds/paper-cut.mp3')
        }
      }
      return newSet
    })
  }, [isSoundEnabled, playSound])

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
    setAnimatingLines(new Set())
  }, [selectedCutLines, headers, rows, onColumnsRemoved])

  const resetSelection = useCallback(() => {
    setSelectedCutLines(new Set())
    setAnimatingLines(new Set())
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="relative">
          <div className="relative mb-20" ref={tableRef}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableHead
                        key={index}
                        ref={(el) => {
                          if (el) {
                            headerRefs.current.set(index, el)
                          }
                        }}
                        className="relative"
                      >
                        {header}
                        {index < headers.length - 1 && (
                          <div
                            className={`absolute top-0 right-0 h-full cursor-pointer transition-all z-10 border-r ${
                              selectedCutLines.has(index)
                                ? 'border-red-500 border-solid'
                                : hoveredLineIndex === index
                                ? 'border-primary/70 border-dashed'
                                : 'border-primary/30 border-dashed'
                            }`}
                            onMouseEnter={() => setHoveredLineIndex(index)}
                            onMouseLeave={() => setHoveredLineIndex(null)}
                            onClick={() => handleCutLineClick(index)}
                            title="クリックして裁断"
                            style={{
                              right: '0',
                              transform: 'translateX(-50%)',
                              width: '20px',
                              borderRightWidth: '2px',
                            }}
                          />
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="relative">
                          {cell}
                          {cellIndex < headers.length - 1 && (
                            <div
                              className={`absolute top-0 right-0 h-full cursor-pointer transition-all z-10 border-r ${
                                selectedCutLines.has(cellIndex)
                                  ? 'border-red-500 border-solid'
                                  : hoveredLineIndex === cellIndex
                                  ? 'border-primary/70 border-dashed'
                                  : 'border-primary/30 border-dashed'
                              }`}
                              onMouseEnter={() => setHoveredLineIndex(cellIndex)}
                              onMouseLeave={() => setHoveredLineIndex(null)}
                              onClick={() => handleCutLineClick(cellIndex)}
                              title="クリックして裁断"
                              style={{
                                right: '0',
                                transform: 'translateX(-50%)',
                                width: '20px',
                                borderRightWidth: '2px',
                              }}
                            />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* ハサミアイコンの表示（すべての切り取り線の中央に） */}
            {Array.from({ length: headers.length - 1 }, (_, index) => index).map((lineIndex) => {
              const position = columnPositions.get(lineIndex)
              if (!position) return null
              const isSelected = selectedCutLines.has(lineIndex)
              const isAnimating = animatingLines.has(lineIndex)
              // 切り取り線の中心はカラムの右端から10px左（width: 20pxの半分）に配置されている
              const lineCenterPosition = position - 10
              return (
                <div
                  key={lineIndex}
                  className="absolute top-0 pointer-events-none z-20"
                  style={{
                    left: `${lineCenterPosition}px`,
                    transform: 'translateX(-50%)',
                    height: '100%',
                  }}
                >
                  {isAnimating && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2"
                      style={{
                        animation: 'scissorsSlide 1s ease-in-out',
                      }}
                    >
                      <div className="bg-background rounded-full p-1">
                        <Scissors className="h-5 w-5 text-red-500" />
                      </div>
                    </div>
                  )}
                  {!isAnimating && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-background rounded-full p-1">
                        <Scissors className={`h-5 w-5 ${isSelected ? 'text-red-500' : 'text-primary/40'}`} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="absolute left-6 right-6 bottom-6 flex items-center justify-between">
            {rows.length > maxRows && (
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                プレビュー: 最初の{maxRows}行を表示（他 {rows.length - maxRows} 行が非表示）
              </p>
            )}
            <div className="flex gap-2">
              <Button onClick={applyCuts} disabled={selectedCutLines.size === 0}>
                サイダン！ 
              </Button>
              <Button variant="outline" onClick={resetSelection} disabled={selectedCutLines.size === 0}>
                選択をリセット
              </Button>
            </div>
          </div>

          {selectedCutLines.size > 0 && (
            <div className="mt-4 mb-20 p-3 bg-muted rounded text-sm">
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
    </div>
  )
}

