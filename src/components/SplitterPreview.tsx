import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Scissors } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { useSound } from '@/hooks/useSound'
import { useSoundSetting } from '@/hooks/useSoundSetting'

interface SplitterPreviewProps {
  rows: string[][]
  selectedColumnCutLines: Set<number>
  rowCutCount: number
  isRowCutSelected: boolean
  appliedColumnCutLines?: Set<number>
  appliedRowCutCount?: number
  onColumnCutLineClick: (index: number) => void
  onRowCutLineClick: () => void
}

export function SplitterPreview({
  rows,
  selectedColumnCutLines,
  rowCutCount,
  isRowCutSelected,
  appliedColumnCutLines,
  appliedRowCutCount,
  onColumnCutLineClick,
  onRowCutLineClick,
}: SplitterPreviewProps) {
  const [animatingColumnLines, setAnimatingColumnLines] = useState<Set<number>>(new Set())
  const [animatingRowLine, setAnimatingRowLine] = useState<boolean>(false)
  const [hoveredColumnLineIndex, setHoveredColumnLineIndex] = useState<number | null>(null)
  const [columnPositions, setColumnPositions] = useState<Map<number, number>>(new Map())
  const [rowPosition, setRowPosition] = useState<number | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<Map<number, HTMLTableCellElement>>(new Map())
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())
  
  // カラム数を最初の行の長さから取得
  const columnCount = rows.length > 0 ? rows[0].length : 0
  const maxRows = 10
  const { playSound } = useSound()
  const { isEnabled: isSoundEnabled } = useSoundSetting()

  // カット行の1行前をトップに表示するための計算
  const displayStartIndex = useMemo(() => {
    if (rowCutCount > 0 && rowCutCount <= rows.length) {
      // カット行の1行前（rowCutCount - 1）から表示開始
      return Math.max(0, rowCutCount - 1)
    }
    return 0
  }, [rowCutCount, rows.length])

  const displayRows = useMemo(() => {
    return rows.slice(displayStartIndex, displayStartIndex + maxRows)
  }, [rows, displayStartIndex])

  // カラムの位置を計算（最初の行のセルから取得）
  useEffect(() => {
    const updatePositions = () => {
      const positions = new Map<number, number>()
      cellRefs.current.forEach((element, index) => {
        if (element && tableRef.current) {
          const tableContainer = tableRef.current.querySelector('table')
          if (tableContainer) {
            const elementRect = element.getBoundingClientRect()
            const containerRect = tableContainer.getBoundingClientRect()
            positions.set(index, elementRect.right - containerRect.left)
          }
        }
      })
      setColumnPositions(positions)
    }

    const timeoutId = setTimeout(updatePositions, 0)
    window.addEventListener('resize', updatePositions)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePositions)
    }
  }, [displayRows, columnCount])

  // 行カット位置を計算
  useEffect(() => {
    const updateRowPosition = () => {
      if (rowCutCount > 0 && rowCutCount <= rows.length) {
        const actualCutRowIndex = rowCutCount - 1 // カットされる行の実際のインデックス
        const rowIndex = actualCutRowIndex - displayStartIndex
        if (rowIndex >= 0 && rowIndex < displayRows.length) {
          const rowElement = rowRefs.current.get(rowIndex)
          if (rowElement && tableRef.current) {
            const tableContainer = tableRef.current.querySelector('table')
            if (tableContainer) {
              const elementRect = rowElement.getBoundingClientRect()
              const containerRect = tableContainer.getBoundingClientRect()
              setRowPosition(elementRect.bottom - containerRect.top)
            }
          }
        } else {
          setRowPosition(null)
        }
      } else {
        setRowPosition(null)
      }
    }

    const timeoutId = setTimeout(updateRowPosition, 0)
    window.addEventListener('resize', updateRowPosition)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateRowPosition)
    }
  }, [rowCutCount, displayRows, displayStartIndex, rows.length])

  const handleColumnCutLineClick = useCallback((index: number) => {
    onColumnCutLineClick(index)
    setAnimatingColumnLines(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
        setTimeout(() => {
          setAnimatingColumnLines(prevAnim => {
            const newAnimSet = new Set(prevAnim)
            newAnimSet.delete(index)
            return newAnimSet
          })
        }, 1000)
        if (isSoundEnabled) {
          playSound('/sounds/paper-cut.mp3')
        }
      }
      return newSet
    })
  }, [onColumnCutLineClick, isSoundEnabled, playSound])

  const handleRowCutLineClick = useCallback(() => {
    onRowCutLineClick()
    setAnimatingRowLine(true)
    setTimeout(() => {
      setAnimatingRowLine(false)
    }, 1000)
    if (isSoundEnabled) {
      playSound('/sounds/paper-cut.mp3')
    }
  }, [onRowCutLineClick, isSoundEnabled, playSound])

  // 削除されるカラムのインデックスを計算（プレビュー表示用）
  const columnsToRemove = useMemo(() => {
    const cutLines = appliedColumnCutLines || selectedColumnCutLines
    if (cutLines.size === 0) {
      return new Set<number>()
    }

    const minCutLineIndex = Math.min(...Array.from(cutLines))
    const columns = new Set<number>()

    for (let i = minCutLineIndex + 1; i < columnCount; i++) {
      columns.add(i)
    }

    return columns
  }, [appliedColumnCutLines, selectedColumnCutLines, columnCount])

  // カットされた行の範囲を計算（ハイライト用）
  const cutRowsRange = useMemo(() => {
    const appliedCount = appliedRowCutCount || 0
    if (appliedCount > 0 && appliedCount <= rows.length) {
      return { start: 0, end: appliedCount }
    }
    return null
  }, [appliedRowCutCount, rows.length])

  // カットされる行のインデックス（表示内での相対位置）
  // rowCutCountは「最初のN行をカット」なので、カット線は(rowCutCount - 1)行目の下に引く
  const cutRowIndexInDisplay = useMemo(() => {
    if (rowCutCount > 0 && rowCutCount <= rows.length) {
      const actualCutRowIndex = rowCutCount - 1 // カットされる行の実際のインデックス
      const rowIndex = actualCutRowIndex - displayStartIndex
      if (rowIndex >= 0 && rowIndex < displayRows.length) {
        return rowIndex
      }
    }
    return null
  }, [rowCutCount, displayStartIndex, displayRows.length, rows.length])

  return (
    <div className="space-y-4">
      <div className="relative" ref={tableRef}>
        <div className="overflow-x-auto">
          <Table>
            <TableBody>
              {displayRows.map((row, rowIndex) => {
                const isCutRow = cutRowIndexInDisplay === rowIndex
                const actualRowIndex = displayStartIndex + rowIndex
                const isInCutRange = cutRowsRange && actualRowIndex >= cutRowsRange.start && actualRowIndex < cutRowsRange.end
                // カット行の1行前をハイライト（選択されている場合のみ）
                const isRowBeforeCut = isRowCutSelected && rowCutCount > 0 && actualRowIndex === rowCutCount - 1
                const isFirstRow = actualRowIndex === 0
                return (
                  <TableRow
                    key={rowIndex}
                    ref={(el) => {
                      if (el) {
                        rowRefs.current.set(rowIndex, el)
                      }
                    }}
                    className={`relative ${isInCutRange ? 'bg-red-500/20' : ''} ${isRowBeforeCut ? 'bg-red-500/10' : ''}`}
                  >
                    {row.map((cell, cellIndex) => (
                      <TableCell 
                        key={cellIndex} 
                        className="relative"
                        ref={(el) => {
                          // 最初の行のセルを参照として保存（カラム位置計算用）
                          if (el && isFirstRow) {
                            cellRefs.current.set(cellIndex, el)
                          }
                        }}
                      >
                        {columnsToRemove.has(cellIndex) && (
                          <div
                            className="absolute top-0 left-0 right-0 h-full bg-red-500/10 pointer-events-none"
                          />
                        )}
                        {cell}
                        {cellIndex < columnCount - 1 && (
                          <div
                            className={`absolute top-0 right-0 h-full cursor-pointer transition-all z-10 border-r ${
                              selectedColumnCutLines.has(cellIndex)
                                ? 'border-red-500 border-solid'
                                : hoveredColumnLineIndex === cellIndex
                                ? 'border-primary/70 border-dashed'
                                : 'border-primary/30 border-dashed'
                            }`}
                            onMouseEnter={() => setHoveredColumnLineIndex(cellIndex)}
                            onMouseLeave={() => setHoveredColumnLineIndex(null)}
                            onClick={() => handleColumnCutLineClick(cellIndex)}
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
                    {isCutRow && (
                      <div
                        className={`absolute bottom-0 left-0 right-0 cursor-pointer transition-all z-10 border-b ${
                          isRowCutSelected
                            ? 'border-red-500 border-solid'
                            : 'border-primary/30 border-dashed'
                        }`}
                        onClick={handleRowCutLineClick}
                        title="クリックして裁断"
                        style={{
                          bottom: '0',
                          transform: 'translateY(50%)',
                          height: '20px',
                          borderBottomWidth: '2px',
                        }}
                      />
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {/* カラムカット用ハサミアイコンの表示 */}
        {Array.from({ length: Math.max(0, columnCount - 1) }, (_, index) => index).map((lineIndex) => {
          const position = columnPositions.get(lineIndex)
          if (!position) return null
          const isSelected = selectedColumnCutLines.has(lineIndex)
          const isAnimating = animatingColumnLines.has(lineIndex)
          const lineCenterPosition = position - 10
          return (
            <div
              key={`col-${lineIndex}`}
              className="absolute top-0 z-20"
              style={{
                left: `${lineCenterPosition}px`,
                transform: 'translateX(-50%)',
                height: '100%',
              }}
            >
              {isAnimating && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 cursor-pointer"
                  style={{
                    animation: 'scissorsSlide 1s ease-in-out',
                  }}
                  onClick={() => handleColumnCutLineClick(lineIndex)}
                >
                  <div className="bg-background rounded-full p-1">
                    <Scissors className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              )}
              {!isAnimating && (
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => handleColumnCutLineClick(lineIndex)}
                >
                  <div className="bg-background rounded-full p-1">
                    <Scissors className={`h-5 w-5 ${isSelected ? 'text-red-500' : 'text-primary/40'}`} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {/* 行カット用ハサミアイコンの表示 */}
        {rowPosition !== null && cutRowIndexInDisplay !== null && (
          <div
            className="absolute left-0 z-20"
            style={{
              top: `${rowPosition}px`,
              transform: 'translateY(-50%)',
              width: '100%',
            }}
          >
            {animatingRowLine ? (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  animation: 'scissorsSlideHorizontal 1s ease-in-out',
                }}
                onClick={handleRowCutLineClick}
              >
                <div className="bg-background rounded-full p-1">
                  <Scissors className="h-5 w-5 text-red-500" />
                </div>
              </div>
            ) : (
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                onClick={handleRowCutLineClick}
              >
                <div className="bg-background rounded-full p-1">
                  <Scissors className={`h-5 w-5 ${isRowCutSelected ? 'text-red-500' : 'text-primary/40'}`} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

