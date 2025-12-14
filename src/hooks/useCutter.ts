import { useState, useCallback } from 'react';
import type { CsvData } from './useCsvProcessor';

export type ProcessedData = CsvData | Array<CsvData>;

export function useCutter() {
  const [originalData, setOriginalData] = useState<CsvData | null>(null);

  // CSVデータを設定（アップロード時）
  const setData = useCallback((data: CsvData) => {
    setOriginalData(data);
  }, []);

  // データ処理関数：元のデータから直接計算
  const processData = useCallback(
    (
      rowCutCount: number,
      columnCutIndex: number | null,
      rowsPerFile: number | null,
      includeHeader: boolean
    ): ProcessedData | null => {
      if (!originalData) {
        return null;
      }

      let processedRows = originalData.rows;

      // 1. 行カット処理（最初のN行を削除）
      if (rowCutCount > 0) {
        if (rowCutCount >= processedRows.length) {
          // すべての行を削除する場合は空のデータを返す
          processedRows = [];
        } else {
          processedRows = processedRows.slice(rowCutCount);
        }
      }

      // 2. カラム削除処理（指定位置より右側を削除）
      if (
        columnCutIndex !== null &&
        columnCutIndex > 0 &&
        processedRows.length > 0
      ) {
        const columnCount = processedRows[0].length;
        const cutLineIndex = columnCutIndex - 1; // 1-based to 0-based

        // 選択線より右側のすべてのカラムを削除（cutLineIndex + 1から最後まで）
        const columnsToRemove = new Set<number>();
        for (let i = cutLineIndex + 1; i < columnCount; i++) {
          columnsToRemove.add(i);
        }

        // 新しい行を作成（カラムを削除）
        processedRows = processedRows.map((row) =>
          row.filter((_, index) => !columnsToRemove.has(index))
        );
      }

      // 3. 行分割処理（指定行数ごとに分割）
      if (rowsPerFile !== null && rowsPerFile > 0 && processedRows.length > 0) {
        const splits: Array<CsvData> = [];
        // ヘッダー行を取得（元のデータの最初の行）
        const headerRow = includeHeader && originalData.rows.length > 0 
          ? originalData.rows[0] 
          : null;
        
        // ヘッダーがある場合、カラム削除処理を適用
        let processedHeaderRow: string[] | null = null;
        if (headerRow) {
          if (
            columnCutIndex !== null &&
            columnCutIndex > 0 &&
            headerRow.length > 0
          ) {
            const columnCount = headerRow.length;
            const cutLineIndex = columnCutIndex - 1;
            const columnsToRemove = new Set<number>();
            for (let i = cutLineIndex + 1; i < columnCount; i++) {
              columnsToRemove.add(i);
            }
            processedHeaderRow = headerRow.filter(
              (_, index) => !columnsToRemove.has(index)
            );
          } else {
            processedHeaderRow = headerRow;
          }
        }
        
        for (let i = 0; i < processedRows.length; i += rowsPerFile) {
          const chunk = processedRows.slice(i, i + rowsPerFile);
          // ヘッダーを含める場合は先頭に追加
          const rowsWithHeader = processedHeaderRow
            ? [processedHeaderRow, ...chunk]
            : chunk;
          splits.push({
            rows: rowsWithHeader,
          });
        }
        return splits;
      }

      // 行分割がない場合は単一のCsvDataを返す
      return { rows: processedRows };
    },
    [originalData]
  );

  // 全状態をリセット
  const reset = useCallback(() => {
    setOriginalData(null);
  }, []);

  // 処理を取り消して元の状態に戻す（この関数はApp.tsxで使用されていないが、互換性のため保持）
  const revert = useCallback(() => {
    // 処理結果はApp.tsxで管理されるため、ここでは何もしない
  }, []);

  return {
    originalData,
    setData,
    processData,
    reset,
    revert,
  };
}
