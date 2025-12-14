import { useCallback } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import type { CsvFileData } from './useCsvProcessor';

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

  // 日付時刻をフォーマット: YYYYMMDDHHmmss
  const formatDateTime = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }, []);

  // ファイル名から拡張子を除去してフォルダ名に使用
  const getFolderName = useCallback((filename: string): string => {
    return filename.replace(/\.csv$/i, '');
  }, []);

  const downloadMultiple = useCallback(
    async (
      files: Array<{
        rows: string[][];
        filename: string;
        originalFilename?: string;
      }>,
      originalFiles?: CsvFileData[]
    ) => {
      // ZIPファイルを作成
      const zip = new JSZip();

      // originalFilenameがある場合、階層構造で整理
      const hasOriginalFilename = files.some((f) => f.originalFilename);

      if (hasOriginalFilename) {
        // 元のファイルごとにグループ化
        const fileGroups = new Map<
          string,
          Array<{ rows: string[][]; filename: string }>
        >();

        files.forEach((file) => {
          if (file.originalFilename) {
            const folderName = getFolderName(file.originalFilename);
            if (!fileGroups.has(folderName)) {
              fileGroups.set(folderName, []);
            }
            fileGroups.get(folderName)!.push({
              rows: file.rows,
              filename: file.filename,
            });
          } else {
            // originalFilenameがない場合は、ファイル名から推測
            const folderName = getFolderName(
              file.filename.replace(/_\d+\.csv$/i, '.csv')
            );
            if (!fileGroups.has(folderName)) {
              fileGroups.set(folderName, []);
            }
            fileGroups.get(folderName)!.push({
              rows: file.rows,
              filename: file.filename,
            });
          }
        });

        // 各フォルダにファイルを追加
        fileGroups.forEach((groupFiles, folderName) => {
          groupFiles.forEach((file) => {
            const csv = Papa.unparse(file.rows);
            zip.file(`${folderName}/${file.filename}`, csv);
          });
        });
      } else if (originalFiles && originalFiles.length > 0) {
        // originalFilenameがないが、originalFilesがある場合
        const fileGroups = new Map<
          string,
          Array<{ rows: string[][]; filename: string }>
        >();

        files.forEach((file) => {
          // ファイル名から元のファイル名を推測
          const baseName = file.filename.replace(/_\d+\.csv$/i, '.csv');
          const originalFile = originalFiles.find(
            (f) => f.filename === baseName
          );

          if (originalFile) {
            const folderName = getFolderName(originalFile.filename);
            if (!fileGroups.has(folderName)) {
              fileGroups.set(folderName, []);
            }
            fileGroups.get(folderName)!.push(file);
          } else {
            // 元のファイルが見つからない場合は、ファイル名から推測
            const folderName = getFolderName(
              file.filename.replace(/_\d+\.csv$/i, '.csv')
            );
            if (!fileGroups.has(folderName)) {
              fileGroups.set(folderName, []);
            }
            fileGroups.get(folderName)!.push(file);
          }
        });

        fileGroups.forEach((groupFiles, folderName) => {
          groupFiles.forEach((file) => {
            const csv = Papa.unparse(file.rows);
            zip.file(`${folderName}/${file.filename}`, csv);
          });
        });
      } else {
        // 元のファイル情報がない場合（後方互換性）、フラット構造
        files.forEach((file) => {
          const csv = Papa.unparse(file.rows);
          zip.file(file.filename, csv);
        });
      }

      // ZIPファイルを生成してダウンロード
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      const zipFilename = `saidan_${formatDateTime()}.zip`;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);
    },
    [formatDateTime, getFolderName]
  );

  return {
    downloadCsv,
    downloadMultiple,
  };
}
