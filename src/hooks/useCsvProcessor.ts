import { useState, useCallback } from 'react';
import Papa from 'papaparse';

export interface CsvData {
  rows: string[][];
}

export interface CsvFileData extends CsvData {
  filename: string;
}

export function useCsvProcessor() {
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [csvFilesData, setCsvFilesData] = useState<CsvFileData[]>([]);
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

  const parseMultipleCsv = useCallback(async (files: File[]): Promise<CsvFileData[]> => {
    setIsProcessing(true);
    setError(null);

    const parsePromises = files.map((file) => {
      return new Promise<CsvFileData>((resolve, reject) => {
        Papa.parse(file, {
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error(`ファイル "${file.name}": ${results.errors.map((e) => e.message).join(', ')}`));
              return;
            }

            if (results.data.length === 0) {
              reject(new Error(`ファイル "${file.name}": CSVファイルが空です`));
              return;
            }

            const rows = results.data as string[][];
            resolve({ rows, filename: file.name });
          },
          error: (error) => {
            reject(new Error(`ファイル "${file.name}": ${error.message}`));
          },
          skipEmptyLines: true,
        });
      });
    });

    try {
      const results = await Promise.all(parsePromises);
      setIsProcessing(false);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ファイルのパースに失敗しました';
      setError(errorMessage);
      setIsProcessing(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setCsvData(null);
    setCsvFilesData([]);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    csvData,
    csvFilesData,
    error,
    isProcessing,
    parseCsv,
    parseMultipleCsv,
    reset,
  };
}
