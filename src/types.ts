export type AlgorithmType = 
  | 'DIJKSTRA' 
  | 'ASTAR' 
  | 'BFS' 
  | 'DFS' 
  | 'GREEDY' 
  | 'BEST_FIRST_SEARCH'
  | 'HILL_CLIMBING' 
  | 'ANNEALING' 
  | 'GENETIC'
  | 'BEAM_SEARCH';

export type ObjectType = 'BARRIER' | 'OIL_SLICK' | 'WATER_PUDDLE' | 'SLIPSTREAM' | 'EMPTY';

export interface Node {
  row: number;
  col: number;
  isStart: boolean;
  isFinish: boolean;
  distance: number;
  isVisited: boolean;
  objectType: ObjectType;
  previousNode: Node | null;
  isPath: boolean;
  heuristic?: number;
  totalCost?: number;
  weight?: number;
}

export interface RaceSession {
  id?: string;
  timestamp: any;
  startPos: { row: number; col: number };
  finishPos: { row: number; col: number };
  algorithm: string;
  telemetry: {
    nodesExplored: number;
    trajectoryLength: number;
    computeLatency: number;
  };
  aiAnalysis?: string;
}

export interface TacticalLog {
  id?: string;
  timestamp: any;
  message: string;
  type: 'info' | 'warning' | 'critical';
}

export interface VisualizerState {
  isRunning: boolean;
  isFinished: boolean;
  speed: number;
  algorithm: AlgorithmType;
}
