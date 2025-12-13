import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Scissors } from 'lucide-react';

interface SplitterPreviewProps {
  rows: string[][];
  rowHeight?: number;
  maxRows?: number;
  numberOfRowsToCut: number;
  numberOfColumnsToCut: number | null;
  isRowCutSelected: boolean;
  appliedColumnCutLines?: Set<number>;
  onColumnCutLineClick: (index: number) => void;
  onRowCutLineClick: () => void;
}

export function SplitterPreview({
  rows,
  rowHeight = 40,
  maxRows = 10,
  numberOfRowsToCut,
  numberOfColumnsToCut,
  isRowCutSelected,
  onColumnCutLineClick,
  onRowCutLineClick,
}: SplitterPreviewProps) {
  const [animatingColumnLines, setAnimatingColumnLines] = useState<Set<number>>(
    new Set()
  );
  const [animatingRowLine, setAnimatingRowLine] = useState<boolean>(false);
  const [hoveredColumnLineIndex, setHoveredColumnLineIndex] = useState<
    number | null
  >(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const columnCount = useMemo(() => {
    return rows.length > 0 ? rows[0].length : 0;
  }, [rows]);

  const [columnWidths, setColumnWidths] = useState<number[]>(
    new Array(columnCount).fill(0)
  );

  const columnPositions = useMemo(() => {
    return columnWidths.map((width, index) => {
      const offsetX = columnWidths
        .slice(0, index)
        .reduce((acc, curr) => acc + curr, 0);
      return offsetX + width;
    });
  }, [columnWidths]);

  // カット行の1行前をトップに表示するための計算
  const displayStartRowIndex = useMemo(() => {
    if (numberOfRowsToCut > 0 && numberOfRowsToCut <= rows.length) {
      // カット行の1行前（rowCutCount - 1）から表示開始
      return Math.max(0, numberOfRowsToCut - 1);
    }
    return 0;
  }, [numberOfRowsToCut, rows.length]);

  const displayRows = useMemo(() => {
    return rows.slice(displayStartRowIndex, displayStartRowIndex + maxRows);
  }, [rows, displayStartRowIndex, maxRows]);

  const rowPositionToCut = useMemo(() => {
    if (
      numberOfRowsToCut === null ||
      numberOfRowsToCut === 0 ||
      numberOfRowsToCut > rows.length
    )
      return null;
    return (numberOfRowsToCut - displayStartRowIndex) * rowHeight;
  }, [numberOfRowsToCut, rows.length, rowHeight, displayStartRowIndex]);

  const onUpdateColumnWidth = useCallback((index: number, width: number) => {
    setColumnWidths((prev) => {
      const newWidths = [...prev];
      newWidths[index] = width;
      return newWidths;
    });
  }, []);

  const onMouseEnterOnColumnLine = useCallback((index: number) => {
    setHoveredColumnLineIndex(index);
  }, []);

  const onMouseLeaveOnColumnLine = useCallback(() => {
    setHoveredColumnLineIndex(null);
  }, []);

  const handleOnColumnCutLineClick = useCallback(
    (index: number) => {
      onColumnCutLineClick(index);

      setAnimatingColumnLines((prev) => {
        const newSet = new Set(prev);
        newSet.add(index);

        // アニメーションが終了したら削除
        setTimeout(() => {
          setAnimatingColumnLines((prevAnim) => {
            const newAnimSet = new Set(prevAnim);
            newAnimSet.delete(index);
            return newAnimSet;
          });
        }, 1000);

        return newSet;
      });
    },
    [onColumnCutLineClick]
  );

  const handleRowCutLineClick = useCallback(() => {
    // 解除時はアニメーションと音を再生しない
    if (isRowCutSelected) {
      onRowCutLineClick();
      return;
    }

    // 追加時のみアニメーションと音を再生
    onRowCutLineClick();
    setAnimatingRowLine(true);
    setTimeout(() => {
      setAnimatingRowLine(false);
    }, 1000);
  }, [onRowCutLineClick, isRowCutSelected]);

  return (
    <div className="space-y-4">
      <div className="relative" ref={tableRef}>
        <div className="overflow-x-auto">
          <table className="w-full" ref={tableRef}>
            <tbody>
              {displayRows.map((row, rowIndex) => {
                return (
                  <Row
                    key={rowIndex}
                    row={row}
                    rowIndex={rowIndex}
                    rowHeight={rowHeight}
                    isRowCut={isRowCutSelected}
                    displayStartRowIndex={displayStartRowIndex}
                    numberOfRowsToCut={numberOfRowsToCut}
                    numberOfColumnsToCut={numberOfColumnsToCut}
                    columnCount={columnCount}
                    hoveredColumnLineIndex={hoveredColumnLineIndex}
                    onMouseEnterOnColumnLine={onMouseEnterOnColumnLine}
                    onMouseLeaveOnColumnLine={onMouseLeaveOnColumnLine}
                    onColumnCutLineClick={handleOnColumnCutLineClick}
                    onRowCutLineClick={handleRowCutLineClick}
                    onUpdateColumnWidth={onUpdateColumnWidth}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        {/* カラムカット用ハサミアイコンの表示 */}
        {Array.from(
          { length: Math.max(0, columnCount - 1) },
          (_, index) => index
        ).map((lineIndex) => {
          return (
            <VerticalCut
              key={lineIndex}
              columnIndex={lineIndex}
              columnPosition={columnPositions[lineIndex]}
              isSelected={
                numberOfColumnsToCut !== null &&
                numberOfColumnsToCut - 1 <= lineIndex
              }
              isAnimating={animatingColumnLines.has(lineIndex)}
              onColumnCutLineClick={handleOnColumnCutLineClick}
            />
          );
        })}
        {/* 行カット用ハサミアイコンの表示 */}
        {rowPositionToCut !== null && (
          <HorizontalCut
            rowPosition={rowPositionToCut}
            isSelected={isRowCutSelected}
            isAnimating={animatingRowLine}
            onRowCutLineClick={handleRowCutLineClick}
          />
        )}
      </div>
    </div>
  );
}

const Row = ({
  row,
  rowIndex,
  rowHeight,
  displayStartRowIndex,
  numberOfRowsToCut,
  isRowCut,
  columnCount,
  numberOfColumnsToCut,
  hoveredColumnLineIndex,
  onMouseEnterOnColumnLine,
  onMouseLeaveOnColumnLine,
  onColumnCutLineClick,
  onRowCutLineClick,
  onUpdateColumnWidth,
}: {
  row: string[];
  rowIndex: number;
  rowHeight: number;
  displayStartRowIndex: number;
  numberOfRowsToCut: number;
  // サイダン処理が行われたか
  isRowCut: boolean;
  columnCount: number;
  numberOfColumnsToCut: number | null;
  hoveredColumnLineIndex: number | null;
  onColumnCutLineClick: (index: number) => void;
  onMouseEnterOnColumnLine: (index: number) => void;
  onMouseLeaveOnColumnLine: (index: number) => void;
  onRowCutLineClick: () => void;
  onUpdateColumnWidth: (index: number, width: number) => void;
}) => {
  const actualRowIndex = useMemo(
    () => displayStartRowIndex + rowIndex,
    [displayStartRowIndex, rowIndex]
  );
  const isInCutRowRange = useMemo(
    () => numberOfRowsToCut > 0 && actualRowIndex < numberOfRowsToCut,
    [numberOfRowsToCut, actualRowIndex]
  );

  return (
    <tr
      className={`relative ${isRowCut && isInCutRowRange ? 'bg-red-500/20' : ''}`}
    >
      {row.map((cell, cellIndex) => (
        <Cell
          key={cellIndex}
          cell={cell}
          columnIndex={cellIndex}
          rowIndex={rowIndex}
          actualRowIndex={actualRowIndex}
          rowHeight={rowHeight}
          isRowCut={isRowCut}
          columnCount={columnCount}
          numberOfRowsToCut={numberOfRowsToCut}
          numberOfColumnsToCut={numberOfColumnsToCut}
          hoveredColumnLineIndex={hoveredColumnLineIndex}
          onColumnCutLineClick={onColumnCutLineClick}
          onMouseEnterOnColumnLine={onMouseEnterOnColumnLine}
          onMouseLeaveOnColumnLine={onMouseLeaveOnColumnLine}
          onRowCutLineClick={onRowCutLineClick}
          onUpdateColumnWidth={onUpdateColumnWidth}
        />
      ))}
    </tr>
  );
};

const Cell = ({
  cell,
  columnIndex,
  rowIndex,
  actualRowIndex,
  rowHeight,
  isRowCut,
  columnCount,
  numberOfRowsToCut,
  numberOfColumnsToCut,
  hoveredColumnLineIndex,
  onColumnCutLineClick,
  onMouseEnterOnColumnLine,
  onMouseLeaveOnColumnLine,
  onRowCutLineClick,
  onUpdateColumnWidth,
}: {
  cell: string;
  columnIndex: number;
  rowIndex: number;
  actualRowIndex: number;
  rowHeight: number;
  isRowCut: boolean;
  columnCount: number;
  numberOfRowsToCut: number;
  numberOfColumnsToCut: number | null;
  hoveredColumnLineIndex: number | null;
  onColumnCutLineClick: (index: number) => void;
  onMouseEnterOnColumnLine: (index: number) => void;
  onMouseLeaveOnColumnLine: (index: number) => void;
  onRowCutLineClick: () => void;
  onUpdateColumnWidth: (index: number, width: number) => void;
}) => {
  const cellRef = useRef<HTMLTableCellElement>(null);

  const isCutOnBottomBorder = useMemo(
    () =>
      numberOfRowsToCut !== null && numberOfRowsToCut - 1 === actualRowIndex,
    [numberOfRowsToCut, actualRowIndex]
  );
  const isCutOnRightBorder = useMemo(
    () =>
      numberOfColumnsToCut !== null && numberOfColumnsToCut - 1 <= columnIndex,
    [numberOfColumnsToCut, columnIndex]
  );
  const isInCutColumnRange = useMemo(
    () => numberOfColumnsToCut !== null && numberOfColumnsToCut <= columnIndex,
    [numberOfColumnsToCut, columnIndex]
  );

  const onMouseEnter = useCallback(() => {
    onMouseEnterOnColumnLine(columnIndex);
  }, [columnIndex, onMouseEnterOnColumnLine]);

  const onMouseLeave = useCallback(() => {
    onMouseLeaveOnColumnLine(columnIndex);
  }, [columnIndex, onMouseLeaveOnColumnLine]);

  const onClick = useCallback(() => {
    onColumnCutLineClick(columnIndex);
  }, [columnIndex, onColumnCutLineClick]);

  useEffect(() => {
    if (rowIndex === 0) {
      const updateColumnWidth = () => {
        const cellRect = cellRef.current?.getBoundingClientRect();
        if (!cellRect) return;

        onUpdateColumnWidth(columnIndex, cellRect.right - cellRect.left);
      };
      updateColumnWidth();
      window.addEventListener('resize', updateColumnWidth);
    }
  }, [cellRef, rowIndex, columnIndex, onUpdateColumnWidth]);

  return (
    <td
      className="relative"
      style={{
        height: rowHeight,
        boxSizing: 'border-box',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 0,
        paddingBottom: 0,
      }}
      ref={cellRef}
    >
      {isCutOnBottomBorder && (
        <div
          className={`absolute bottom-0 left-0 right-0 cursor-pointer transition-all z-10 border-b ${
            isRowCut
              ? 'border-red-500 border-solid'
              : 'border-primary/30 border-dashed'
          }`}
          onClick={onRowCutLineClick}
          style={{
            bottom: '0',
            height: '20px',
            borderBottomWidth: '2px',
          }}
        />
      )}
      {isInCutColumnRange && (
        <div className="absolute top-0 left-0 right-0 h-full bg-red-500/10 pointer-events-none" />
      )}
      {cell}
      {/* ボーダー */}
      {columnIndex < columnCount - 1 && (
        <div
          className={`absolute top-0 right-0 h-full cursor-pointer transition-all z-10 border-r ${
            isCutOnRightBorder
              ? 'border-red-500 border-solid'
              : hoveredColumnLineIndex === columnIndex
                ? 'border-primary/70 border-dashed'
                : 'border-primary/30 border-dashed'
          }`}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
          style={{
            right: '0',
            width: '20px',
            borderRightWidth: '2px',
          }}
        />
      )}
    </td>
  );
};

const VerticalCut = ({
  columnIndex,
  columnPosition,
  isSelected,
  isAnimating,
  onColumnCutLineClick,
}: {
  columnIndex: number;
  columnPosition: number | null;
  isSelected: boolean;
  isAnimating: boolean;
  onColumnCutLineClick: (index: number) => void;
}) => {
  const handleOnColumnCutLineClick = useCallback(() => {
    onColumnCutLineClick(columnIndex);
  }, [columnIndex, onColumnCutLineClick]);

  if (!columnPosition) return null;

  return (
    <div
      className="absolute top-0 z-20"
      style={{
        left: `${columnPosition}px`,
        transform: 'translateX(-50%)',
        height: '100%',
      }}
    >
      {isAnimating ? (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 cursor-pointer"
          style={{
            animation: 'scissorsSlide 1s ease-in-out',
          }}
          onClick={handleOnColumnCutLineClick}
        >
          <div className="bg-background rounded-full p-1">
            <Scissors className="h-5 w-5 text-red-500" />
          </div>
        </div>
      ) : (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          onClick={handleOnColumnCutLineClick}
        >
          <div className="bg-background rounded-full p-1">
            <Scissors
              className={`h-5 w-5 ${isSelected ? 'text-red-500' : 'text-primary/40'}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const HorizontalCut = ({
  rowPosition,
  isSelected,
  isAnimating,
  onRowCutLineClick,
}: {
  rowPosition: number | null;
  isSelected: boolean;
  isAnimating: boolean;
  onRowCutLineClick: () => void;
}) => {
  return (
    <div
      className="absolute left-0 z-20"
      style={{
        top: `${rowPosition}px`,
        width: '100%',
      }}
    >
      {isAnimating ? (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer"
          style={{
            animation: 'scissorsSlideHorizontal 1s ease-in-out',
          }}
          onClick={onRowCutLineClick}
        >
          <div className="bg-background rounded-full p-1">
            <Scissors className="h-5 w-5 text-red-500" />
          </div>
        </div>
      ) : (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          onClick={onRowCutLineClick}
        >
          <div className="bg-background rounded-full p-1">
            <Scissors
              className={`h-5 w-5 ${isSelected ? 'text-red-500' : 'text-primary/40'}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
