import { useState, useCallback, useMemo, useRef, useEffect } from 'react'

export interface CsvData {
  headers: string[]
  rows: string[][]
}

export function useCutter() {
  const [originalData, setOriginalData] = useState<CsvData | null>(null)
  const [columnCutData, setColumnCutData] = useState<CsvData | null>(null)
  const [rowSplitData, setRowSplitData] = useState<Array<CsvData> | null>(null)
  const [rowsPerFile, setRowsPerFile] = useState<number>(100)
  const rowSplitDataRef = useRef<Array<CsvData> | null>(null)
  const rowsPerFileRef = useRef<number>(100)

  // rowSplitDataとrowsPerFileの最新値をrefに保持
  useEffect(() => {
    rowSplitDataRef.current = rowSplitData
  }, [rowSplitData])

  useEffect(() => {
    rowsPerFileRef.current = rowsPerFile
  }, [rowsPerFile])

  // 現在表示/処理に使用するデータ（カラム削除済みならそれ、なければ元データ）
  const currentData = useMemo(() => {
    return columnCutData || originalData
  }, [columnCutData, originalData])

  // CSVデータを設定（アップロード時）
  const setData = useCallback((data: CsvData) => {
    setOriginalData(data)
    setColumnCutData(null)
    setRowSplitData(null)
  }, [])

  // カラム削除処理
  const cutColumns = useCallback((
    selectedCutLines: Set<number>,
    isInverted: boolean
  ) => {
    if (!currentData || selectedCutLines.size === 0) {
      return
    }

    const { headers, rows } = currentData

    // 選択された線のインデックスから、削除するカラムのインデックスを計算
    // 複数線選択時は、最も左側の線（最小インデックス）を基準にする
    const minCutLineIndex = Math.min(...Array.from(selectedCutLines))
    const columnsToRemove = new Set<number>()

    if (isInverted) {
      // 反転モード: 選択線より左側のすべてのカラムを削除（0からcutLineIndexまで）
      for (let i = 0; i <= minCutLineIndex; i++) {
        columnsToRemove.add(i)
      }
    } else {
      // デフォルトモード: 選択線より右側のすべてのカラムを削除（cutLineIndex + 1から最後まで）
      for (let i = minCutLineIndex + 1; i < headers.length; i++) {
        columnsToRemove.add(i)
      }
    }

    // 新しいヘッダーと行を作成
    const newHeaders = headers.filter((_, index) => !columnsToRemove.has(index))
    const newRows = rows.map(row => row.filter((_, index) => !columnsToRemove.has(index)))

    const newColumnCutData: CsvData = { headers: newHeaders, rows: newRows }
    setColumnCutData(newColumnCutData)

    // 行分割データがあれば、カラム削除後のデータで再計算
    if (rowSplitDataRef.current && rowSplitDataRef.current.length > 0 && rowsPerFileRef.current > 0) {
      const splits: Array<CsvData> = []
      for (let i = 0; i < newRows.length; i += rowsPerFileRef.current) {
        const chunk = newRows.slice(i, i + rowsPerFileRef.current)
        splits.push({
          headers: newHeaders,
          rows: chunk,
        })
      }
      setRowSplitData(splits)
    }
  }, [currentData])

  // 行分割処理
  const splitRows = useCallback((rowsPerFileValue: number) => {
    if (!currentData || rowsPerFileValue <= 0) {
      return
    }

    const { headers, rows } = currentData
    setRowsPerFile(rowsPerFileValue)

    const splits: Array<CsvData> = []
    for (let i = 0; i < rows.length; i += rowsPerFileValue) {
      const chunk = rows.slice(i, i + rowsPerFileValue)
      splits.push({
        headers,
        rows: chunk,
      })
    }

    setRowSplitData(splits)
  }, [currentData])

  // 全状態をリセット
  const reset = useCallback(() => {
    setOriginalData(null)
    setColumnCutData(null)
    setRowSplitData(null)
    setRowsPerFile(100)
  }, [])

  return {
    originalData,
    columnCutData,
    rowSplitData,
    currentData,
    rowsPerFile,
    setData,
    cutColumns,
    splitRows,
    reset,
  }
}

