import { useCallback } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';

export function useDownload() {
  const downloadCsv = useCallback((rows: string[][], filename: string) => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const downloadMultiple = useCallback(
    async (
      files: Array<{ rows: string[][]; filename: string }>,
      baseFilename?: string
    ) => {
      // ZIPファイルを作成
      const zip = new JSZip();

      // 各CSVファイルをZIPに追加
      files.forEach((file) => {
        const csv = Papa.unparse(file.rows);
        zip.file(file.filename, csv);
      });

      // ZIPファイルを生成してダウンロード
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      const zipFilename = baseFilename
        ? `${baseFilename.replace(/\.csv$/i, '')}.zip`
        : 'split_files.zip';
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);
    },
    []
  );

  return {
    downloadCsv,
    downloadMultiple,
  };
}
