import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Input } from '@/components/ui/input'

interface RowSplitterProps {
  headers?: string[]
  rows?: string[][]
  rowsPerFile: number
  splitData?: Array<{ headers: string[]; rows: string[][] }> | null
  onSplitRows: (rowsPerFile: number) => void
  onRowsPerFileChange?: (rowsPerFile: number) => void
}

export interface RowSplitterHandle {
  applySplit: () => void
  getRowsPerFile: () => number
}

export const RowSplitter = forwardRef<RowSplitterHandle, RowSplitterProps>(
  ({ rowsPerFile, onSplitRows, onRowsPerFileChange }, ref) => {
  const [localRowsPerFile, setLocalRowsPerFile] = useState<number>(rowsPerFile)

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
  }, [localRowsPerFile, onSplitRows])

  // 親から呼び出せるようにする
  useImperativeHandle(ref, () => ({
    applySplit: handleSplit,
    getRowsPerFile: () => localRowsPerFile,
  }), [handleSplit, localRowsPerFile])

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="rowsPerFile" className="block text-sm font-medium mb-2">
          1ファイルあたりの行数
        </label>
        <Input
          id="rowsPerFile"
          type="number"
          min="1"
          value={localRowsPerFile}
          onChange={(e) => {
            const value = Number.parseInt(e.target.value) || 0
            setLocalRowsPerFile(value)
            if (onRowsPerFileChange) {
              onRowsPerFileChange(value)
            }
          }}
          placeholder="100"
        />
      </div>
    </div>
  )
})

RowSplitter.displayName = 'RowSplitter'

