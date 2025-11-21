import { useCallback } from 'react'
import Papa from 'papaparse'

export function useDownload() {
  const downloadCsv = useCallback((headers: string[], rows: string[][], filename: string) => {
    const data = [headers, ...rows]
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const downloadMultiple = useCallback((
    files: Array<{ headers: string[]; rows: string[][]; filename: string }>
  ) => {
    // 少し遅延を入れて順次ダウンロード
    files.forEach((file, index) => {
      setTimeout(() => {
        downloadCsv(file.headers, file.rows, file.filename)
      }, index * 200) // 200ms間隔でダウンロード
    })
  }, [downloadCsv])

  return {
    downloadCsv,
    downloadMultiple,
  }
}

