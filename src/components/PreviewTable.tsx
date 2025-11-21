import { useRef, useEffect, useState } from 'react'
import { Scissors } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PreviewTableProps {
  headers: string[]
  rows: string[][]
  maxRows?: number
  cutMode?: boolean
  selectedCutLines?: Set<number>
}

export function PreviewTable({ 
  headers, 
  rows, 
  maxRows = 10,
  cutMode = false,
  selectedCutLines = new Set()
}: PreviewTableProps) {
  const displayRows = rows.slice(0, maxRows)
  const [columnPositions, setColumnPositions] = useState<Map<number, number>>(new Map())
  const tableRef = useRef<HTMLDivElement>(null)
  const headerRefs = useRef<Map<number, HTMLTableCellElement>>(new Map())

  // カラムの位置を計算（裁断モード時のみ）
  useEffect(() => {
    if (!cutMode) return

    const updatePositions = () => {
      const positions = new Map<number, number>()
      headerRefs.current.forEach((element, index) => {
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
  }, [headers, displayRows, cutMode])

  return (
    <Card>
      <CardHeader>
        <CardTitle>プレビュー（最初の{maxRows}行）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto" ref={tableRef}>
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead 
                    key={index}
                    ref={(el) => {
                      if (el && cutMode) {
                        headerRefs.current.set(index, el)
                      }
                    }}
                    className="relative"
                  >
                    {header}
                    {cutMode && index < headers.length - 1 && (
                      <div
                        className={`absolute top-0 right-0 h-full pointer-events-none z-10 border-r ${
                          selectedCutLines.has(index)
                            ? 'border-red-500 border-solid'
                            : 'border-primary/30 border-dashed'
                        }`}
                        style={{
                          transform: 'translateX(50%)',
                          borderRightWidth: '1px',
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
                      {cutMode && cellIndex < headers.length - 1 && (
                        <div
                          className={`absolute top-0 right-0 h-full pointer-events-none z-10 border-r ${
                            selectedCutLines.has(cellIndex)
                              ? 'border-red-500 border-solid'
                              : 'border-primary/30 border-dashed'
                          }`}
                          style={{
                            transform: 'translateX(50%)',
                            borderRightWidth: '1px',
                          }}
                        />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* ハサミアイコンの表示（裁断モード時、すべての切り取り線の中央に） */}
          {cutMode && Array.from({ length: headers.length - 1 }, (_, index) => index).map((lineIndex) => {
            const position = columnPositions.get(lineIndex)
            if (!position) return null
            const isSelected = selectedCutLines.has(lineIndex)
            return (
              <div
                key={lineIndex}
                className="absolute top-0 pointer-events-none z-20"
                style={{
                  left: `${position}px`,
                  transform: 'translateX(-50%)',
                  height: '100%',
                }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Scissors className={`h-3 w-3 ${isSelected ? 'text-red-500' : 'text-primary/40'}`} />
                </div>
              </div>
            )
          })}
        </div>
        {rows.length > maxRows && (
          <p className="mt-4 text-sm text-muted-foreground">
            他 {rows.length - maxRows} 行が非表示です
          </p>
        )}
      </CardContent>
    </Card>
  )
}

