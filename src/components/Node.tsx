import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { ObjectType } from '../types';
import { 
  Droplets, 
  Wind, 
  Grid3X3, 
  MoveHorizontal, 
  Flag, 
  Gauge 
} from 'lucide-react';

interface NodeProps {
  col: number;
  row: number;
  isFinish: boolean;
  isStart: boolean;
  objectType: ObjectType;
  isVisited: boolean;
  isPath: boolean;
  onMouseDown: (row: number, col: number) => void;
  onMouseEnter: (row: number, col: number) => void;
  onMouseUp: () => void;
}

const Node: React.FC<NodeProps> = ({
  col,
  row,
  isFinish,
  isStart,
  objectType,
  isVisited,
  isPath,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
}) => {
  const getObjectStyles = () => {
    if (isStart) return 'bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.5)] z-20 scale-110 rounded-xl border-none';
    if (isFinish) return 'bg-brand-red text-white shadow-[0_0_25px_rgba(255,0,0,0.5)] z-20 scale-110 rounded-xl border-none';
    
    if (isPath) return 'bg-white shadow-[0_0_20px_rgba(255,255,255,1)] z-10 scale-90 rounded-sm animate-pulse';
    if (isVisited) return 'bg-brand-red/10 border border-brand-red/20 scale-75 rounded-full transition-all duration-700';

    switch (objectType) {
      case 'BARRIER':
        return 'bg-slate-900 border border-white/10 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]';
      case 'OIL_SLICK':
        return 'bg-brand-red/30 backdrop-blur-sm border border-brand-red/20 animate-pulse';
      case 'WATER_PUDDLE':
        return 'bg-blue-500/30 backdrop-blur-sm border border-blue-400/20';
      case 'SLIPSTREAM':
        return 'bg-emerald-500/30 backdrop-blur-sm border border-emerald-400/20';
      default:
        return 'hover:bg-white/5';
    }
  };

  const getIcon = () => {
    if (isStart) return <Gauge size={16} strokeWidth={3} />;
    if (isFinish) return <Flag size={16} strokeWidth={3} />;
    
    switch (objectType) {
      case 'BARRIER':
        return <Grid3X3 size={10} className="text-slate-700" />;
      case 'OIL_SLICK':
        return <Droplets size={10} className="text-brand-red" />;
      case 'WATER_PUDDLE':
        return <Wind size={10} className="text-blue-400" />;
      case 'SLIPSTREAM':
        return <MoveHorizontal size={10} className="text-emerald-400" />;
      default:
        return null;
    }
  };

  return (
    <div
      id={`node-${row}-${col}`}
      className={cn(
        "w-full aspect-square flex items-center justify-center transition-all duration-300 cursor-crosshair border-[0.5px] border-white/5",
        getObjectStyles()
      )}
      onMouseDown={() => onMouseDown(row, col)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseUp={() => onMouseUp()}
    >
      <motion.div
        initial={false}
        animate={{ 
          scale: isVisited || isPath || objectType !== 'EMPTY' || isStart || isFinish ? 1 : 0.8,
          opacity: isVisited || isPath || objectType !== 'EMPTY' || isStart || isFinish ? 1 : 0.4
        }}
      >
        {getIcon()}
      </motion.div>
    </div>
  );
};

export default Node;
