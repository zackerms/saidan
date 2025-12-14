import { useState, useCallback } from 'react';
import type { CsvData, CsvFileData } from './useCsvProcessor';

export type ProcessedData = CsvData | Array<CsvData>;
export type ProcessedFileData = Array<{ rows: string[][]; filename: string; originalFilename: string }>;

export function useCutter() {
  const [originalData, setOriginalData] = useState<CsvData | null>(null);
  const [originalFilesData, setOriginalFilesData] = useState<CsvFileData[]>([]);

  // CSVデータを設定（アップロード時）- 単一ファイル用（後方互換性のため保持）
  const setData = useCallback((data: CsvData) => {
    setOriginalData(data);
  }, []);

  // 複数CSVファイルを設定（アップロード時）
  const setFilesData = useCallback((data: CsvFileData[]) => {
    setOriginalFilesData(data);
  }, []);

  // データ処理関数：元のデータから直接計算（単一ファイル用）
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

  // 複数ファイルのデータ処理関数：全ファイルに対して処理を適用
  const processFilesData = useCallback(
    (
      rowCutCount: number,
      columnCutIndex: number | null,
      rowsPerFile: number | null,
      includeHeader: boolean
    ): ProcessedFileData | null => {
      if (originalFilesData.length === 0) {
        return null;
      }

      const processedFiles: Array<{ rows: string[][]; filename: string; originalFilename: string }> = [];

      for (const fileData of originalFilesData) {
        let processedRows = fileData.rows;

        // 1. 行カット処理（最初のN行を削除）
        if (rowCutCount > 0) {
          if (rowCutCount >= processedRows.length) {
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
          const cutLineIndex = columnCutIndex - 1;

          const columnsToRemove = new Set<number>();
          for (let i = cutLineIndex + 1; i < columnCount; i++) {
            columnsToRemove.add(i);
          }

          processedRows = processedRows.map((row) =>
            row.filter((_, index) => !columnsToRemove.has(index))
          );
        }

        // 3. 行分割処理（指定行数ごとに分割）
        if (rowsPerFile !== null && rowsPerFile > 0 && processedRows.length > 0) {
          const splits: Array<{ rows: string[][]; filename: string; originalFilename: string }> = [];
          const headerRow = includeHeader && fileData.rows.length > 0 
            ? fileData.rows[0] 
            : null;
          
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
          
          const baseFilename = fileData.filename.replace(/\.csv$/i, '');
          for (let i = 0; i < processedRows.length; i += rowsPerFile) {
            const chunk = processedRows.slice(i, i + rowsPerFile);
            const rowsWithHeader = processedHeaderRow
              ? [processedHeaderRow, ...chunk]
              : chunk;
            splits.push({
              rows: rowsWithHeader,
              filename: `${baseFilename}_${splits.length + 1}.csv`,
              originalFilename: fileData.filename,
            });
          }
          processedFiles.push(...splits);
        } else {
          // 行分割がない場合は単一のファイルを追加
          processedFiles.push({
            rows: processedRows,
            filename: fileData.filename,
            originalFilename: fileData.filename,
          });
        }
      }

      return processedFiles;
    },
    [originalFilesData]
  );

  // 全状態をリセット
  const reset = useCallback(() => {
    setOriginalData(null);
    setOriginalFilesData([]);
  }, []);

  // 処理を取り消して元の状態に戻す（この関数はApp.tsxで使用されていないが、互換性のため保持）
  const revert = useCallback(() => {
    // 処理結果はApp.tsxで管理されるため、ここでは何もしない
  }, []);

  return {
    originalData,
    originalFilesData,
    setData,
    setFilesData,
    processData,
    processFilesData,
    reset,
    revert,
  };
}
