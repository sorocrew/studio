import React from 'react';
import { GripVertical } from 'lucide-react';

export interface ResizeHandleProps {
  splitPercent: number;
  minPercent?: number;
  maxPercent?: number;
  isDragging: boolean;
  onDragStart: (e: React.MouseEvent<HTMLDivElement>) => void;
  onStepResize?: (deltaPercent: number) => void;
  onReset?: () => void;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  splitPercent,
  minPercent = 30,
  maxPercent = 70,
  isDragging,
  onDragStart,
  onStepResize,
  onReset,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onStepResize) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onStepResize(-2);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onStepResize(2);
    } else if (e.key === 'Home' && onReset) {
      e.preventDefault();
      onReset();
    }
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize workspace panels"
      aria-valuemin={minPercent}
      aria-valuemax={maxPercent}
      aria-valuenow={Math.round(splitPercent)}
      tabIndex={0}
      onMouseDown={onDragStart}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      title={`Drag to resize panels (${Math.round(splitPercent)}% / ${Math.round(100 - splitPercent)}%). Double-click to reset.`}
      className={`hidden lg:flex flex-col items-center justify-center w-3.5 mx-1.5 rounded-lg border-2 border-black cursor-col-resize select-none transition-colors shrink-0 ${
        isDragging
          ? 'bg-blue-600 text-white shadow-[2px_2px_0px_0px_#000000]'
          : 'bg-white text-black hover:bg-yellow-300 shadow-[2px_2px_0px_0px_#000000]'
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-1 py-2 px-0.5 border-y-2 border-black bg-slate-100 text-black rounded-sm">
        <span className="w-1 h-1 rounded-full bg-black" />
        <GripVertical className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="w-1 h-1 rounded-full bg-black" />
      </div>
    </div>
  );
};

export default ResizeHandle;
