import { useState, useCallback } from 'react';
import Papa from 'papaparse';

export interface CsvData {
  rows: string[][];
}

export function useCsvProcessor() {
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseCsv = useCallback((file: File) => {
    setIsProcessing(true);
    setError(null);

    Papa.parse(file, {
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(results.errors.map((e) => e.message).join(', '));
          setIsProcessing(false);
          return;
        }

        if (results.data.length === 0) {
          setError('CSVファイルが空です');
          setIsProcessing(false);
          return;
        }

        const rows = results.data as string[][];

        setCsvData({ rows });
        setIsProcessing(false);
      },
      error: (error) => {
        setError(error.message);
        setIsProcessing(false);
      },
      skipEmptyLines: true,
    });
  }, []);

  const reset = useCallback(() => {
    setCsvData(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    csvData,
    error,
    isProcessing,
    parseCsv,
    reset,
  };
}
