import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { CsvData } from './useCsvProcessor';

export function useCutter() {
  const [originalData, setOriginalData] = useState<CsvData | null>(null);
  const [rowCutData, setRowCutData] = useState<CsvData | null>(null);
  const [columnCutData, setColumnCutData] = useState<CsvData | null>(null);
  const [rowSplitData, setRowSplitData] = useState<Array<CsvData> | null>(null);
  const [rowsPerFile, setRowsPerFile] = useState<number>(100);
  const rowSplitDataRef = useRef<Array<CsvData> | null>(null);
  const rowsPerFileRef = useRef<number>(100);

  // rowSplitDataとrowsPerFileの最新値をrefに保持
  useEffect(() => {
    rowSplitDataRef.current = rowSplitData;
  }, [rowSplitData]);

  useEffect(() => {
    rowsPerFileRef.current = rowsPerFile;
  }, [rowsPerFile]);

  // 現在表示/処理に使用するデータ（行カット→カラムカットの順で適用）
  const currentData = useMemo(() => {
    return columnCutData || rowCutData || originalData;
  }, [columnCutData, rowCutData, originalData]);

  // CSVデータを設定（アップロード時）
  const setData = useCallback((data: CsvData) => {
    setOriginalData(data);
    setRowCutData(null);
    setColumnCutData(null);
    setRowSplitData(null);
  }, []);

  // 行カット処理（最初のN行を削除）
  const cutRows = useCallback(
    (numRows: number) => {
      if (!originalData || numRows <= 0) {
        return;
      }

      const { rows } = originalData;

      // 最初のN行を削除
      if (numRows >= rows.length) {
        // すべての行を削除する場合は空のデータを返す
        const newRowCutData: CsvData = { rows: [] };
        setRowCutData(newRowCutData);
        return;
      }

      const newRows = rows.slice(numRows);
      const newRowCutData: CsvData = { rows: newRows };
      setRowCutData(newRowCutData);

      // カラムカットデータがあれば、行カット後のデータで再計算
      if (columnCutData && columnCutData.rows.length > 0) {
        // カラムカット後の列数を取得
        const cutColumnCount = columnCutData.rows[0].length;

        // 行カット後のデータに対して、カラムカット後の列数だけを保持
        const cutRows = newRows.map((row) => {
          return row.slice(0, cutColumnCount);
        });
        setColumnCutData({ rows: cutRows });
      }

      // 行分割データがあれば、行カット後のデータで再計算
      if (
        rowSplitDataRef.current &&
        rowSplitDataRef.current.length > 0 &&
        rowsPerFileRef.current > 0
      ) {
        const splits: Array<CsvData> = [];
        for (let i = 0; i < newRows.length; i += rowsPerFileRef.current) {
          const chunk = newRows.slice(i, i + rowsPerFileRef.current);
          splits.push({
            rows: chunk,
          });
        }
        setRowSplitData(splits);
      }
    },
    [originalData, columnCutData]
  );

  // カラム削除処理
  const cutColumns = useCallback(
    (selectedCutLines: Set<number>) => {
      const dataToUse = rowCutData || originalData;
      if (!dataToUse || selectedCutLines.size === 0) {
        return;
      }

      const { rows } = dataToUse;

      // 行が空の場合は処理しない
      if (rows.length === 0) {
        return;
      }

      // 最初の行の長さからカラム数を取得
      const columnCount = rows[0].length;

      // 選択された線のインデックスから、削除するカラムのインデックスを計算
      // 複数線選択時は、最も左側の線（最小インデックス）を基準にする
      const minCutLineIndex = Math.min(...Array.from(selectedCutLines));
      const columnsToRemove = new Set<number>();

      // 選択線より右側のすべてのカラムを削除（cutLineIndex + 1から最後まで）
      for (let i = minCutLineIndex + 1; i < columnCount; i++) {
        columnsToRemove.add(i);
      }

      // 新しい行を作成（カラムを削除）
      const newRows = rows.map((row) =>
        row.filter((_, index) => !columnsToRemove.has(index))
      );

      const newColumnCutData: CsvData = { rows: newRows };
      setColumnCutData(newColumnCutData);

      // 行分割データがあれば、カラム削除後のデータで再計算
      if (
        rowSplitDataRef.current &&
        rowSplitDataRef.current.length > 0 &&
        rowsPerFileRef.current > 0
      ) {
        const splits: Array<CsvData> = [];
        for (let i = 0; i < newRows.length; i += rowsPerFileRef.current) {
          const chunk = newRows.slice(i, i + rowsPerFileRef.current);
          splits.push({
            rows: chunk,
          });
        }
        setRowSplitData(splits);
      }
    },
    [rowCutData, originalData]
  );

  // 行分割処理
  const splitRows = useCallback(
    (rowsPerFileValue: number) => {
      const dataToUse = columnCutData || rowCutData || originalData;
      if (!dataToUse || rowsPerFileValue <= 0) {
        return;
      }

      const { rows } = dataToUse;
      setRowsPerFile(rowsPerFileValue);

      const splits: Array<CsvData> = [];
      for (let i = 0; i < rows.length; i += rowsPerFileValue) {
        const chunk = rows.slice(i, i + rowsPerFileValue);
        splits.push({
          rows: chunk,
        });
      }

      setRowSplitData(splits);
    },
    [columnCutData, rowCutData, originalData]
  );

  // 全状態をリセット
  const reset = useCallback(() => {
    setOriginalData(null);
    setRowCutData(null);
    setColumnCutData(null);
    setRowSplitData(null);
    setRowsPerFile(100);
  }, []);

  // 処理を取り消して元の状態に戻す
  const revert = useCallback(() => {
    setRowCutData(null);
    setColumnCutData(null);
    setRowSplitData(null);
  }, []);

  return {
    originalData,
    rowCutData,
    columnCutData,
    rowSplitData,
    currentData,
    rowsPerFile,
    setRowsPerFile,
    setData,
    cutRows,
    cutColumns,
    splitRows,
    reset,
    revert,
  };
}
