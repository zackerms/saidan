import { useState, useCallback, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Scissors } from 'lucide-react'
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
  onCutColumns: (selectedCutLines: Set<number>) => void
  onSelectionChange?: (selectedCutLines: Set<number>) => void
  initialSelectedCutLines?: Set<number>
}

export interface ColumnCutterHandle {
  applyCuts: () => void
  getSelectedCutLines: () => Set<number>
}

export const ColumnCutter = forwardRef<ColumnCutterHandle, ColumnCutterProps>(
  ({ headers, rows, onCutColumns, onSelectionChange, initialSelectedCutLines }, ref) => {
  // 親から渡された初期選択状態を使用（タブ切り替え時も状態を保持）
  const [selectedCutLines, setSelectedCutLines] = useState<Set<number>>(() => 
    initialSelectedCutLines ? new Set(initialSelectedCutLines) : new Set()
  )
  const [animatingLines, setAnimatingLines] = useState<Set<number>>(new Set())
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null)
  const [columnPositions, setColumnPositions] = useState<Map<number, number>>(new Map())
  const tableRef = useRef<HTMLDivElement>(null)
  const headerRefs = useRef<Map<number, HTMLTableCellElement>>(new Map())
  const prevInitialSelectedCutLinesRef = useRef<Set<number> | undefined>(initialSelectedCutLines)
  const maxRows = 10
  const displayRows = rows.slice(0, maxRows)
  const { playSound } = useSound()
  const { isEnabled: isSoundEnabled } = useSoundSetting()

  // 親から渡された初期選択状態と同期（実際に変更があった場合のみ更新）
  // このケースでは、親から渡されたpropsの変更に応じて状態を更新する必要があるため、
  // useEffect内でsetStateを呼び出すのが適切です
  useEffect(() => {
    if (initialSelectedCutLines !== undefined) {
      const prevSet = prevInitialSelectedCutLinesRef.current
      const newSet = new Set(initialSelectedCutLines)
      
      // 前の値と比較して、変更があった場合のみ更新
      if (!prevSet || 
          prevSet.size !== newSet.size || 
          Array.from(prevSet).some(val => !newSet.has(val)) ||
          Array.from(newSet).some(val => !prevSet.has(val))) {
        // 親から渡されたpropsの変更に応じて状態を更新する必要があるため、
        // このケースではuseEffect内でsetStateを呼び出すのが適切です
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedCutLines(newSet)
        prevInitialSelectedCutLinesRef.current = newSet
      }
    }
  }, [initialSelectedCutLines])

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
      // 選択状態の変化を親に通知
      if (onSelectionChange) {
        onSelectionChange(newSet)
      }
      return newSet
    })
  }, [isSoundEnabled, playSound, onSelectionChange])

  // 外部から呼び出される裁断実行関数
  const applyCuts = useCallback(() => {
    if (selectedCutLines.size === 0) {
      return
    }

    onCutColumns(selectedCutLines)
    setSelectedCutLines(new Set())
    setAnimatingLines(new Set())
    if (onSelectionChange) {
      onSelectionChange(new Set())
    }
  }, [selectedCutLines, onCutColumns, onSelectionChange])

  // 親から呼び出せるようにする
  useImperativeHandle(ref, () => ({
    applyCuts,
    getSelectedCutLines: () => selectedCutLines,
  }), [applyCuts, selectedCutLines])

  // 削除されるカラムのインデックスを計算（プレビュー表示用）
  const columnsToRemove = useMemo(() => {
    if (selectedCutLines.size === 0) {
      return new Set<number>()
    }

    // 複数線選択時は、最も左側の線（最小インデックス）を基準にする
    const minCutLineIndex = Math.min(...Array.from(selectedCutLines))
    const columns = new Set<number>()

    // 選択線より右側のすべてのカラムを削除（cutLineIndex + 1から最後まで）
    for (let i = minCutLineIndex + 1; i < headers.length; i++) {
      columns.add(i)
    }

    return columns
  }, [selectedCutLines, headers.length])

  return (
    <div className="space-y-4">
      <div className="relative" ref={tableRef}>
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
                    {columnsToRemove.has(index) && (
                      <div
                        className="absolute top-0 left-0 right-0 h-full bg-red-500/10 pointer-events-none"
                      />
                    )}
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
                      {columnsToRemove.has(cellIndex) && (
                        <div
                          className="absolute top-0 left-0 right-0 h-full bg-red-500/10 pointer-events-none"
                        />
                      )}
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
                  onClick={() => handleCutLineClick(lineIndex)}
                >
                  <div className="bg-background rounded-full p-1">
                    <Scissors className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              )}
              {!isAnimating && (
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => handleCutLineClick(lineIndex)}
                >
                  <div className="bg-background rounded-full p-1">
                    <Scissors className={`h-5 w-5 ${isSelected ? 'text-red-500' : 'text-primary/40'}`} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {rows.length > maxRows && (
        <p className="text-sm text-muted-foreground">
          プレビュー: 最初の{maxRows}行を表示（他 {rows.length - maxRows} 行が非表示）
        </p>
      )}
    </div>
  )
})

ColumnCutter.displayName = 'ColumnCutter'

