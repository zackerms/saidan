import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Scissors } from 'lucide-react';

interface SplitterPreviewProps {
  rows: string[][];
  rowHeight?: number;
  rowCountToDisplay?: number;
  columnIndexToCut: number | null;
  rowIndexToDisplay: number | null;
  rowIndexToCut: number | null;
  appliedColumnCutLines?: Set<number>;
  onColumnCutLineClick: (index: number) => void;
  onRowCutLineClick: RowCutLineClickHandler;
}

export type RowCutLineClickHandler = (rowNumber: number) => void;

export function SplitterPreview({
  rows,
  rowHeight = 40,
  rowCountToDisplay = 10,
  columnIndexToCut,
  rowIndexToDisplay,
  rowIndexToCut,
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
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isNearBorder, setIsNearBorder] = useState<boolean>(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const displayRows = useMemo(() => {
    const startIndex = rowIndexToDisplay ?? 0;
    return rows.slice(startIndex, startIndex + rowCountToDisplay);
  }, [rows, rowIndexToDisplay, rowCountToDisplay]);

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

  const handleRowCutLineClick: RowCutLineClickHandler = useCallback(
    (rowIndex: number) => {
      onRowCutLineClick(rowIndex);

      // 選択解除時にはアニメーションを再生しない
      if (rowIndexToCut === rowIndex) {
        return;
      }

      setAnimatingRowLine(true);
      setTimeout(() => {
        setAnimatingRowLine(false);
      }, 1000);
    },
    [onRowCutLineClick, rowIndexToCut]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setMousePosition({
        x: mouseX,
        y: mouseY,
      });

      // ボーダー検出の閾値
      const threshold = 5;
      let nearBorder = false;

      // カラムの縦線をチェック
      for (let i = 0; i < columnPositions.length; i++) {
        const borderX = columnPositions[i];
        if (borderX !== null && Math.abs(mouseX - borderX) <= threshold) {
          nearBorder = true;
          break;
        }
      }

      // 行の横線をチェック（まだ近くない場合のみ）
      if (!nearBorder) {
        for (let i = 0; i <= rowCountToDisplay; i++) {
          const borderY = (i + 1) * rowHeight;
          if (Math.abs(mouseY - borderY) <= threshold) {
            nearBorder = true;
            break;
          }
        }
      }

      setIsNearBorder(nearBorder);
    },
    [columnPositions, rowHeight, rowCountToDisplay]
  );

  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
    setIsNearBorder(false);
  }, []);

  return (
    <div className="space-y-4">
      <div
        className="relative"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div> 
          <table className="w-full" ref={tableRef}>
            <tbody>
              {displayRows.map((row, rowIndexInTable) => {
                return (
                  <Row
                    key={rowIndexInTable}
                    row={row}
                    rowIndex={rowIndexInTable + (rowIndexToDisplay ?? 0)}
                    rowIndexInTable={rowIndexInTable}
                    rowHeight={rowHeight}
                    rowIndexToCut={rowIndexToCut}
                    rowIndexToDisplay={rowIndexToDisplay}
                    columnIndexToCut={columnIndexToCut}
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
              columnIndexToCut={columnIndexToCut}
              columnPosition={columnPositions[lineIndex]}
              isAnimating={animatingColumnLines.has(lineIndex)}
              onColumnCutLineClick={handleOnColumnCutLineClick}
            />
          );
        })}
        {/* 行カット用ハサミアイコンの表示 */}
        {Array.from({ length: rowCountToDisplay }, (_, index) => index).map(
          (rowIndexInTable) => {
            return (
              <HorizontalCut
                key={rowIndexInTable}
                rowIndex={rowIndexInTable + (rowIndexToDisplay ?? 0)}
                rowIndexToCut={rowIndexToCut}
                offsetYInTable={(rowIndexInTable + 1) * rowHeight}
                isAnimating={animatingRowLine}
                onRowCutLineClick={handleRowCutLineClick}
              />
            );
          }
        )}
        {/* マウス位置にハサミアイコンを表示 */}
        {mousePosition && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="rounded-full p-1 shadow-md transition-all duration-200">
              <Scissors
                className={`transition-all duration-200 ${
                  isNearBorder
                    ? 'h-12 w-12 text-red-500'
                    : 'h-6 w-6 text-primary'
                }`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Row = ({
  row,
  rowIndex,
  rowIndexInTable,
  rowHeight,
  rowIndexToCut,
  columnCount,
  columnIndexToCut,
  hoveredColumnLineIndex,
  onMouseEnterOnColumnLine,
  onMouseLeaveOnColumnLine,
  onColumnCutLineClick,
  onRowCutLineClick,
  onUpdateColumnWidth,
}: {
  row: string[];
  rowIndex: number;
  rowIndexInTable: number;
  rowIndexToCut: number | null;
  rowIndexToDisplay: number | null;
  rowHeight: number;
  columnCount: number;
  columnIndexToCut: number | null;
  hoveredColumnLineIndex: number | null;
  onColumnCutLineClick: (index: number) => void;
  onMouseEnterOnColumnLine: (index: number) => void;
  onMouseLeaveOnColumnLine: (index: number) => void;
  onRowCutLineClick: RowCutLineClickHandler;
  onUpdateColumnWidth: (index: number, width: number) => void;
}) => {
  const isRowCut = useMemo(
    () => rowIndexToCut !== null && rowIndexToCut === rowIndex,
    [rowIndexToCut, rowIndex]
  );

  const isInCutRowRange = useMemo(
    () => rowIndexToCut !== null && rowIndex <= rowIndexToCut,
    [rowIndexToCut, rowIndex]
  );

  return (
    <tr className={`relative ${isInCutRowRange ? 'bg-red-500/20' : ''}`}>
      {row.map((cell, cellIndex) => (
        <Cell
          key={cellIndex}
          cell={cell}
          columnIndex={cellIndex}
          rowIndex={rowIndex}
          rowIndexInTable={rowIndexInTable}
          rowHeight={rowHeight}
          isRowCut={isRowCut}
          columnCount={columnCount}
          rowIndexToCut={rowIndexToCut}
          columnIndexToCut={columnIndexToCut}
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
  rowIndexInTable,
  rowHeight,
  isRowCut,
  columnCount,
  rowIndexToCut,
  columnIndexToCut,
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
  rowIndexInTable: number;
  rowHeight: number;
  isRowCut: boolean;
  columnCount: number;
  rowIndexToCut: number | null;
  columnIndexToCut: number | null;
  hoveredColumnLineIndex: number | null;
  onColumnCutLineClick: (index: number) => void;
  onMouseEnterOnColumnLine: (index: number) => void;
  onMouseLeaveOnColumnLine: (index: number) => void;
  onRowCutLineClick: RowCutLineClickHandler;
  onUpdateColumnWidth: (index: number, width: number) => void;
}) => {
  const cellRef = useRef<HTMLTableCellElement>(null);

  const isCutOnBottomBorder = useMemo(
    () => rowIndexToCut !== null && rowIndexToCut === rowIndex,
    [rowIndexToCut, rowIndex]
  );

  const isCutOnRightBorder = useMemo(
    () => columnIndexToCut !== null && columnIndexToCut - 1 === columnIndex,
    [columnIndexToCut, columnIndex]
  );

  const isInCutColumnRange = useMemo(
    () => columnIndexToCut !== null && columnIndexToCut <= columnIndex,
    [columnIndexToCut, columnIndex]
  );

  const isHovered = useMemo(
    () =>
      hoveredColumnLineIndex !== null && hoveredColumnLineIndex === columnIndex,
    [hoveredColumnLineIndex, columnIndex]
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

  const handleOnRowCutLineClick = useCallback(() => {
    onRowCutLineClick(rowIndex);
  }, [rowIndex, onRowCutLineClick]);

  useEffect(() => {
    if (rowIndexInTable === 0) {
      const updateColumnWidth = () => {
        const cellRect = cellRef.current?.getBoundingClientRect();
        if (!cellRect) return;

        onUpdateColumnWidth(columnIndex, cellRect.right - cellRect.left);
      };
      updateColumnWidth();
      window.addEventListener('resize', updateColumnWidth);
    }
  }, [
    cellRef,
    rowIndex,
    rowIndexInTable,
    columnIndex,
    rowIndexToCut,
    onUpdateColumnWidth,
  ]);

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
      <div
        className={`absolute bottom-0 left-0 right-0 cursor-pointer transition-all z-10 border-b-2 ${
          isRowCut && isCutOnBottomBorder
            ? 'border-red-500 border-solid'
            : 'border-primary/30 border-dashed'
        }`}
      />
      {columnIndex < columnCount - 1 && (
        <div
          className={`absolute top-0 right-0 h-full cursor-pointer transition-all z-10 border-r-2 ${
            isCutOnRightBorder
              ? 'border-red-500 border-solid'
              : isHovered
                ? 'border-primary/70 border-dashed'
                : 'border-primary/30 border-dashed'
          }`}
        />
      )}
      {isInCutColumnRange && (
        <div className="absolute top-0 left-0 right-0 h-full bg-red-500/10 pointer-events-none" />
      )}
      {cell}
      {/* 右ボーダー あたり判定 */}
      {columnIndex < columnCount - 1 && (
        <div
          className={`absolute top-0 right-0 h-full cursor-pointer z-10`}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
          style={{
            right: 0,
            width: 10,
            transform: 'translateX(50%)',
          }}
        />
      )}
      {/* 下ボーダー あたり判定 */}
      <div
        className={`absolute bottom-0 left-0 right-0 cursor-pointer z-10`}
        onClick={handleOnRowCutLineClick}
        style={{
          bottom: 0,
          height: 10,
          transform: 'translateY(50%)',
        }}
      />
    </td>
  );
};

const VerticalCut = ({
  columnIndex,
  columnIndexToCut,
  columnPosition,
  isAnimating,
  onColumnCutLineClick,
}: {
  columnIndex: number;
  columnIndexToCut: number | null;
  columnPosition: number | null;
  isAnimating: boolean;
  onColumnCutLineClick: (index: number) => void;
}) => {
  const isCutOnThisLine = useMemo(() => {
    if (!columnIndexToCut) return false;
    return columnIndexToCut - 1 === columnIndex;
  }, [columnIndexToCut, columnIndex]);

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
        isCutOnThisLine && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            onClick={handleOnColumnCutLineClick}
          >
            <div className="bg-background rounded-full p-1">
              <Scissors className={`h-5 w-5 text-red-500`} />
            </div>
          </div>
        )
      )}
    </div>
  );
};

const HorizontalCut = ({
  rowIndex,
  rowIndexToCut,
  offsetYInTable,
  isAnimating,
  onRowCutLineClick,
}: {
  rowIndex: number | null;
  rowIndexToCut: number | null;
  offsetYInTable: number;
  isAnimating: boolean;
  onRowCutLineClick: RowCutLineClickHandler;
}) => {
  const isCutOnThisLine = useMemo(() => {
    if (rowIndexToCut === null) return false;
    return rowIndexToCut === rowIndex;
  }, [rowIndexToCut, rowIndex]);

  const handleOnRowCutLineClick = useCallback(() => {
    if (!rowIndex) return;
    onRowCutLineClick(rowIndex);
  }, [rowIndex, onRowCutLineClick]);

  return (
    <div
      className="absolute left-0 z-20"
      style={{
        top: offsetYInTable,
        width: '100%',
      }}
    >
      {isAnimating && isCutOnThisLine ? (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer"
          style={{
            animation: 'scissorsSlideHorizontal 1s ease-in-out',
          }}
          onClick={handleOnRowCutLineClick}
        >
          <div className="bg-background rounded-full p-1">
            <Scissors className="h-5 w-5 text-red-500" />
          </div>
        </div>
      ) : (
        isCutOnThisLine && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            onClick={handleOnRowCutLineClick}
          >
            <div className="bg-background rounded-full p-1">
              <Scissors className={`h-5 w-5 text-red-500`} />
            </div>
          </div>
        )
      )}
    </div>
  );
};
