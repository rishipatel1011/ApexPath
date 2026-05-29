import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  RotateCcw, 
  Settings2, 
  ChevronRight, 
  Info, 
  Grid3X3, 
  Zap,
  Target,
  Layers,
  Cpu,
  Activity,
  Database,
  Save,
  Compass,
  Wind,
  Dna,
  Flame,
  Radio,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  History,
  MoveHorizontal,
  Terminal,
  Flag,
  Timer,
  Gauge,
  Trophy,
  Droplets
} from 'lucide-react';
import { cn } from './lib/utils';
import Node from './components/Node';
import RaceHistory from './components/RaceHistory';
import AITacticalAdvisor from './components/AITacticalAdvisor';
import Speedometer from './components/Speedometer';
import { AlgorithmType, Node as NodeType, ObjectType, VisualizerState, RaceSession } from './types';
import { 
  bfs, 
  dfs, 
  dijkstra, 
  astar, 
  greedy, 
  bestFirstSearch,
  hillClimbing, 
  beamSearch, 
  simulatedAnnealing, 
  geneticAlgorithm, 
  getNodesInShortestPathOrder 
} from './lib/algorithms';
import { auth, db, googleProvider, signInWithPopup, collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

const GRID_ROWS = 20;
const GRID_COLS = 40;
const START_NODE_ROW = 10;
const START_NODE_COL = 8;
const FINISH_NODE_ROW = 10;
const FINISH_NODE_COL = 32;

export default function App() {
  const [grid, setGrid] = useState<NodeType[][]>([]);
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingFinish, setIsDraggingFinish] = useState(false);
  const [startNodePos, setStartNodePos] = useState({ row: START_NODE_ROW, col: START_NODE_COL });
  const [finishNodePos, setFinishNodePos] = useState({ row: FINISH_NODE_ROW, col: FINISH_NODE_COL });
  const [selectedObjectType, setSelectedObjectType] = useState<ObjectType>('BARRIER');
  const [discipline, setDiscipline] = useState('F1');
  const [raceMode, setRaceMode] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [sessions, setSessions] = useState<RaceSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const disciplines = [
    { id: 'F1', name: 'Formula 1', icon: <Gauge size={16} />, accent: 'text-red-500' },
    { id: 'RALLY', name: 'WRC Rally', icon: <Wind size={16} />, accent: 'text-orange-500' },
    { id: 'DAKAR', name: 'Dakar', icon: <Compass size={16} />, accent: 'text-yellow-500' },
    { id: 'MOTOGP', name: 'MotoGP', icon: <Activity size={16} />, accent: 'text-blue-500' },
    { id: 'NASCAR', name: 'NASCAR', icon: <RotateCcw size={16} />, accent: 'text-red-600' },
    { id: 'MOTOCROSS', name: 'Motocross', icon: <Droplets size={16} />, accent: 'text-green-500' },
  ];
  
  const [state, setState] = useState<VisualizerState>({
    isRunning: false,
    isFinished: false,
    speed: 50,
    algorithm: 'ASTAR',
  });
  
  const [telemetry, setTelemetry] = useState({
    nodesExplored: 0,
    trajectoryLength: 0,
    frontierSize: 0,
    computeLatency: 0,
  });
  
  const [logs, setLogs] = useState<string[]>(['ApexPath Telemetry ready. Optimize racing lines and analyze track conditions.']);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Sound Effect Initialization
  useEffect(() => {
    audioRef.current = new Audio('https://www.soundjay.com/transportation/sounds/car-racing-1.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        addLog(`Driver ${currentUser.displayName || 'Anonymous'} authenticated.`);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Race Sessions
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'race_sessions'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RaceSession));
      setSessions(sessionData);
    });
    return () => unsubscribe();
  }, [user]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  const saveSession = async (nodesExplored: number, trajectoryLength: number, computeLatency: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'race_sessions'), {
        timestamp: serverTimestamp(),
        startPos: startNodePos,
        finishPos: finishNodePos,
        algorithm: state.algorithm,
        telemetry: {
          nodesExplored,
          trajectoryLength,
          computeLatency
        },
        userId: user.uid
      });
      addLog("Race telemetry archived to cloud storage.");
    } catch (error) {
      console.error("Failed to save session", error);
    }
  };

  // Initialize Grid
  const initializeGrid = useCallback(() => {
    const newGrid = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      const currentRow = [];
      for (let col = 0; col < GRID_COLS; col++) {
        currentRow.push({
          col,
          row,
          isStart: row === startNodePos.row && col === startNodePos.col,
          isFinish: row === finishNodePos.row && col === finishNodePos.col,
          distance: Infinity,
          isVisited: false,
          objectType: 'EMPTY' as ObjectType,
          previousNode: null,
          isPath: false,
        });
      }
      newGrid.push(currentRow);
    }
    setGrid(newGrid);
    setState(prev => ({ ...prev, isFinished: false, isRunning: false }));
    setTelemetry({ nodesExplored: 0, trajectoryLength: 0, frontierSize: 0, computeLatency: 0 });
    clearTimeouts();
  }, [startNodePos, finishNodePos]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 3));
  };

  // Grid Interactions
  const handleMouseDown = (row: number, col: number) => {
    if (state.isRunning || state.isFinished) return;
    
    const node = grid[row][col];
    if (node.isStart) {
      setIsDraggingStart(true);
      setMouseIsPressed(true);
      return;
    }
    if (node.isFinish) {
      setIsDraggingFinish(true);
      setMouseIsPressed(true);
      return;
    }

    const newGrid = getNewGridWithObjectToggled(grid, row, col);
    setGrid(newGrid);
    setMouseIsPressed(true);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!mouseIsPressed || state.isRunning || state.isFinished) return;
    
    if (isDraggingStart) {
      const node = grid[row][col];
      if (node.isFinish || node.objectType !== 'EMPTY') return;
      setStartNodePos({ row, col });
      return;
    }
    
    if (isDraggingFinish) {
      const node = grid[row][col];
      if (node.isStart || node.objectType !== 'EMPTY') return;
      setFinishNodePos({ row, col });
      return;
    }

    const newGrid = getNewGridWithObjectToggled(grid, row, col);
    setGrid(newGrid);
  };

  const handleMouseUp = () => {
    setMouseIsPressed(false);
    setIsDraggingStart(false);
    setIsDraggingFinish(false);
  };

  const getNewGridWithObjectToggled = (grid: NodeType[][], row: number, col: number) => {
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    if (node.isStart || node.isFinish) return newGrid;
    
    // If clicking same object type, set to empty, else set to selected type
    const newObjectType = node.objectType === selectedObjectType ? 'EMPTY' : selectedObjectType;
    
    const newNode = {
      ...node,
      objectType: newObjectType,
    };
    newGrid[row][col] = newNode;
    return newGrid;
  };

  // Pathfinding Execution
  const visualizePathfinding = () => {
    if (state.isRunning) return;
    
    const startTime = performance.now();
    setState(prev => ({ ...prev, isRunning: true }));
    addLog(`Optimization Protocol ${state.algorithm} engaged.`);

    const startNode = grid[startNodePos.row][startNodePos.col];
    const finishNode = grid[finishNodePos.row][finishNodePos.col];
    let visitedNodesInOrder: NodeType[] = [];

    // Reset visited states but keep objects
    const resetGrid = grid.map(row => row.map(node => ({
      ...node,
      isVisited: false,
      distance: Infinity,
      previousNode: null,
      isPath: false,
    })));

    switch (state.algorithm) {
      case 'BFS':
        visitedNodesInOrder = bfs(resetGrid, resetGrid[startNodePos.row][startNodePos.col], resetGrid[finishNodePos.row][finishNodePos.col]);
        break;
      case 'DFS':
        visitedNodesInOrder = dfs(resetGrid, resetGrid[startNodePos.row][startNodePos.col], resetGrid[finishNodePos.row][finishNodePos.col]);
        break;
      case 'DIJKSTRA':
        visitedNodesInOrder = dijkstra(resetGrid, resetGrid[startNodePos.row][startNodePos.col], resetGrid[finishNodePos.row][finishNodePos.col]);
        break;
      case 'ASTAR':
        visitedNodesInOrder = astar(resetGrid, resetGrid[startNodePos.row][startNodePos.col], resetGrid[finishNodePos.row][finishNodePos.col]);
        break;
      case 'GREEDY':
        visitedNodesInOrder = greedy(resetGrid, resetGrid[startNodePos.row][startNodePos.col], resetGrid[finishNodePos.row][finishNodePos.col]);
        break;
      case 'BEST_FIRST_SEARCH':
        visitedNodesInOrder = bestFirstSearch(resetGrid, resetGrid[startNodePos.row][startNodePos.col], resetGrid[finishNodePos.row][finishNodePos.col]);
        break;
      case 'HILL_CLIMBING':
        visitedNodesInOrder = hillClimbing(resetGrid, resetGrid[startNodePos.row][startNodePos.col], resetGrid[finishNodePos.row][finishNodePos.col]);
        break;
      case 'BEAM_SEARCH':
        visitedNodesInOrder = beamSearch(resetGrid, resetGrid[startNodePos.row][startNodePos.col], resetGrid[finishNodePos.row][finishNodePos.col]);
        break;
      case 'ANNEALING':
        visitedNodesInOrder = simulatedAnnealing(resetGrid, resetGrid[startNodePos.row][startNodePos.col], resetGrid[finishNodePos.row][finishNodePos.col]);
        break;
      case 'GENETIC':
        visitedNodesInOrder = geneticAlgorithm(resetGrid, resetGrid[startNodePos.row][startNodePos.col], resetGrid[finishNodePos.row][finishNodePos.col]);
        break;
      default:
        visitedNodesInOrder = astar(resetGrid, resetGrid[startNodePos.row][startNodePos.col], resetGrid[finishNodePos.row][finishNodePos.col]);
    }

    const nodesInShortestPathOrder = getNodesInShortestPathOrder(resetGrid[finishNodePos.row][finishNodePos.col]);
    const endTime = performance.now();
    
    setTelemetry(prev => ({
      ...prev,
      computeLatency: Math.round(endTime - startTime),
      frontierSize: visitedNodesInOrder.length * 10, // Simulated
    }));
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked by browser", e));
    }

    animatePathfinding(visitedNodesInOrder, nodesInShortestPathOrder);
  };

  const animatePathfinding = (visitedNodesInOrder: NodeType[], nodesInShortestPathOrder: NodeType[]) => {
    const speedMultiplier = raceMode ? 0.2 : 1;
    const baseDelay = 10 * (101 - state.speed) / 50 * speedMultiplier;

    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        const timeout = setTimeout(() => {
          animateShortestPath(nodesInShortestPathOrder);
        }, baseDelay * i);
        timeoutsRef.current.push(timeout);
        return;
      }
      const timeout = setTimeout(() => {
        const node = visitedNodesInOrder[i];
        setGrid(prevGrid => {
          const newGrid = [...prevGrid];
          newGrid[node.row] = [...newGrid[node.row]];
          newGrid[node.row][node.col] = { ...node, isVisited: true };
          return newGrid;
        });
        setTelemetry(prev => ({ ...prev, nodesExplored: i + 1 }));
        setProgress((i / visitedNodesInOrder.length) * 100);
      }, baseDelay * i);
      timeoutsRef.current.push(timeout);
    }
  };

  const animateShortestPath = (nodesInShortestPathOrder: NodeType[]) => {
    const speedMultiplier = raceMode ? 0.2 : 1;
    const baseDelay = 50 * (101 - state.speed) / 50 * speedMultiplier;

    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      const timeout = setTimeout(() => {
        const node = nodesInShortestPathOrder[i];
        setGrid(prevGrid => {
          const newGrid = [...prevGrid];
          newGrid[node.row] = [...newGrid[node.row]];
          newGrid[node.row][node.col] = { ...node, isPath: true };
          return newGrid;
        });
        setTelemetry(prev => ({ ...prev, trajectoryLength: i + 1 }));
        if (i === nodesInShortestPathOrder.length - 1) {
          setState(prev => ({ ...prev, isRunning: false, isFinished: true }));
          setProgress(100);
          if (audioRef.current) {
            audioRef.current.pause();
          }
          addLog('Optimal racing line calculated.');
          saveSession(telemetry.nodesExplored, i + 1, telemetry.computeLatency);
        }
      }, baseDelay * i);
      timeoutsRef.current.push(timeout);
    }
  };

  const loadBenchmark = (type: string) => {
    clearTimeouts();
    setState(prev => ({ ...prev, isFinished: false, isRunning: false }));
    setTelemetry({ nodesExplored: 0, trajectoryLength: 0, frontierSize: 0, computeLatency: 0 });

    const newGrid: NodeType[][] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      const currentRow: NodeType[] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        currentRow.push({
          col,
          row,
          isStart: row === startNodePos.row && col === startNodePos.col,
          isFinish: row === finishNodePos.row && col === finishNodePos.col,
          distance: Infinity,
          isVisited: false,
          objectType: 'EMPTY' as ObjectType,
          previousNode: null,
          isPath: false,
        });
      }
      newGrid.push(currentRow);
    }

    if (type === 'DEAD_END') {
      for (let r = 5; r < Math.min(17, GRID_ROWS); r++) newGrid[r][25].objectType = 'BARRIER';
      for (let c = 15; c < Math.min(25, GRID_COLS); c++) {
        if (newGrid[5]) newGrid[5][c].objectType = 'BARRIER';
        if (newGrid[16]) newGrid[16][c].objectType = 'BARRIER';
      }
    } else if (type === 'S_CURVE') {
      // Create an S-shaped path with barriers
      for (let r = 0; r < Math.min(16, GRID_ROWS); r++) newGrid[r][20].objectType = 'BARRIER';
      for (let r = 6; r < GRID_ROWS; r++) newGrid[r][30].objectType = 'BARRIER';
    } else if (type === 'SPARSE') {
      // Randomly scattered track conditions
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (newGrid[r][c].isStart || newGrid[r][c].isFinish) continue;
          const rand = Math.random();
          if (rand < 0.12) {
            const types: ObjectType[] = ['BARRIER', 'OIL_SLICK', 'WATER_PUDDLE'];
            newGrid[r][c].objectType = types[Math.floor(Math.random() * types.length)];
          }
        }
      }
    }

    setGrid(newGrid);
    addLog(`Scenario ${type} loaded.`);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-slate-200 font-sans selection:bg-brand-red/30 overflow-x-hidden grid-background relative">
      <div className="scanline pointer-events-none" />
      
      {/* Top Header Section */}
      <header className="max-w-[1700px] mx-auto pt-10 px-12 flex justify-between items-end mb-16 relative z-20">
        <div className="flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-1 bg-brand-red" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red">Racing Intelligence System</span>
          </motion.div>
          
          <div className="flex items-center gap-12">
            <h1 className="text-7xl font-black tracking-tighter text-white uppercase leading-none">
              APEX<span className="text-brand-red glow-red">PATH</span>
            </h1>
            
            <div className="hidden xl:flex items-center gap-10 pl-12 border-l border-white/10">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">Active Discipline</span>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-brand-red/10 rounded-lg text-brand-red">
                    {disciplines.find(d => d.id === discipline)?.icon}
                  </div>
                  <span className="text-white font-display font-bold text-sm uppercase">{disciplines.find(d => d.id === discipline)?.name}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">Neural Latency</span>
                <span className="text-white font-mono text-sm">{telemetry.computeLatency}ms</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 pl-5 rounded-3xl">
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-white uppercase tracking-tighter">{user.displayName}</span>
                <span className="text-[9px] text-brand-red font-bold uppercase tracking-[0.2em]">Elite Strategist</span>
              </div>
              <img src={user.photoURL || ''} alt="User" className="w-12 h-12 rounded-2xl border-2 border-white/10" referrerPolicy="no-referrer" />
              <button onClick={logout} className="p-3 text-slate-500 hover:text-white transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button onClick={login} className="btn-primary flex items-center gap-3">
              <LogIn size={20} />
              AUTHENTICATE DRIVER
            </button>
          )}
        </div>
      </header>

      <div className="max-w-[1700px] mx-auto px-12 flex flex-col gap-12 pb-32 relative z-10">
        {/* Discipline Selector - Horizontal Scroll */}
        <section className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {disciplines.map((d) => (
            <button
              key={d.id}
              onClick={() => setDiscipline(d.id)}
              className={cn(
                "discipline-card min-w-[200px] flex items-center gap-4 group",
                discipline === d.id && "active"
              )}
            >
              <div className={cn(
                "p-3 rounded-xl transition-all",
                discipline === d.id ? "bg-brand-red text-white" : "bg-white/5 text-slate-500 group-hover:text-white"
              )}>
                {d.icon}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Discipline</span>
                <span className="text-xs font-bold text-white uppercase">{d.name}</span>
              </div>
              {discipline === d.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-red"
                />
              )}
            </button>
          ))}
        </section>

        <div className="flex gap-12 relative">
          {/* Speedometer Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-40">
            <Speedometer progress={progress} isRunning={state.isRunning} />
          </div>

          {/* Left Sidebar - Navigation Console */}
          <aside className="w-[380px] flex flex-col gap-8">
            <div className="glass-panel p-8 space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Strategy Engine</h2>
                </div>
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                    "p-3 rounded-2xl transition-all",
                    showHistory ? "bg-brand-red text-white" : "bg-white/5 text-slate-500 hover:text-white"
                  )}
                >
                  <History size={20} />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {showHistory ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-[600px]"
                  >
                    <RaceHistory sessions={sessions} onSelectSession={(s) => {
                      setStartNodePos(s.startPos);
                      setFinishNodePos(s.finishPos);
                      setState(prev => ({ ...prev, algorithm: s.algorithm as AlgorithmType }));
                      setShowHistory(false);
                    }} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="controls"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-10"
                  >
                    {/* Protocol Selection */}
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] flex items-center gap-3">
                          <div className="w-8 h-[1px] bg-slate-800" />
                          Informed Protocols
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'BFS', icon: <Radio size={14} />, label: 'BFS Burst' },
                            { id: 'DFS', icon: <Activity size={14} />, label: 'DFS Depth' },
                          ].map((algo) => (
                            <button
                              key={algo.id}
                              onClick={() => setState(prev => ({ ...prev, algorithm: algo.id as AlgorithmType }))}
                              className={cn(
                                "text-left px-4 py-4 rounded-2xl border transition-all flex items-center gap-3 group",
                                state.algorithm === algo.id 
                                  ? "bg-brand-red/10 border-brand-red/40 text-brand-red shadow-[0_0_20px_rgba(255,0,0,0.1)]" 
                                  : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300"
                              )}
                            >
                              {algo.icon}
                              <span className="text-[10px] font-black tracking-tighter uppercase">{algo.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] flex items-center gap-3">
                          <div className="w-8 h-[1px] bg-slate-800" />
                          Heuristic Engines
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: 'ASTAR', icon: <Zap size={14} />, label: 'Neural A* Optimizer' },
                            { id: 'BEST_FIRST_SEARCH', icon: <Target size={14} />, label: 'Best-First Pursuit' },
                            { id: 'GREEDY', icon: <Cpu size={14} />, label: 'Greedy Apex Strategy' },
                          ].map((algo) => (
                            <button
                              key={algo.id}
                              onClick={() => setState(prev => ({ ...prev, algorithm: algo.id as AlgorithmType }))}
                              className={cn(
                                "w-full text-left px-4 py-4 rounded-2xl border transition-all flex items-center justify-between group",
                                state.algorithm === algo.id 
                                  ? "bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                                  : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                {algo.icon}
                                <span className="text-[10px] font-black tracking-tighter uppercase">{algo.label}</span>
                              </div>
                              {state.algorithm === algo.id && <motion.div layoutId="algo-active"><ChevronRight size={14} className="text-brand-red" /></motion.div>}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] flex items-center gap-3">
                          <div className="w-8 h-[1px] bg-slate-800" />
                          Advanced Optimization
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'DIJKSTRA', icon: <Layers size={14} />, label: 'Dijkstra' },
                            { id: 'HILL_CLIMBING', icon: <Activity size={14} />, label: 'Hill Climb' },
                            { id: 'ANNEALING', icon: <Flame size={14} />, label: 'Annealing' },
                            { id: 'GENETIC', icon: <Dna size={14} />, label: 'Genetic' },
                            { id: 'BEAM_SEARCH', icon: <Zap size={14} />, label: 'Beam' },
                          ].map((algo) => (
                            <button
                              key={algo.id}
                              onClick={() => setState(prev => ({ ...prev, algorithm: algo.id as AlgorithmType }))}
                              className={cn(
                                "text-left px-4 py-4 rounded-2xl border transition-all flex items-center gap-3 group",
                                state.algorithm === algo.id 
                                  ? "bg-white/10 border-white/20 text-white" 
                                  : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300"
                              )}
                            >
                              {algo.icon}
                              <span className="text-[10px] font-black tracking-tighter uppercase">{algo.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Hazard Mapping */}
                    <div className="space-y-6">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">Track Conditions</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'BARRIER', color: 'bg-white', icon: <Grid3X3 size={14} /> },
                          { id: 'OIL_SLICK', color: 'bg-brand-red', icon: <Droplets size={14} /> },
                          { id: 'WATER_PUDDLE', color: 'bg-blue-500', icon: <Wind size={14} /> },
                          { id: 'SLIPSTREAM', color: 'bg-emerald-500', icon: <MoveHorizontal size={14} /> },
                        ].map((obj) => (
                          <button
                            key={obj.id}
                            onClick={() => setSelectedObjectType(obj.id as ObjectType)}
                            className={cn(
                              "px-4 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-tighter flex items-center gap-3 transition-all",
                              selectedObjectType === obj.id 
                                ? "bg-white/10 border-white/20 text-white" 
                                : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                            )}
                          >
                            <div className={cn("w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]", obj.color)} />
                            {obj.id.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Engage Button */}
              <div className="flex gap-3 pt-6">
                <button 
                  onClick={visualizePathfinding}
                  disabled={state.isRunning}
                  className="btn-primary flex-1 flex items-center justify-center gap-4 py-5"
                >
                  <Play size={24} fill="currentColor" /> 
                  <span className="text-lg">ENGAGE OPTIMIZER</span>
                </button>
                <button 
                  onClick={initializeGrid}
                  className="btn-secondary p-5"
                >
                  <RotateCcw size={24} />
                </button>
              </div>
            </div>

            {/* AI Tactical Advisor */}
            <div className="h-[350px]">
              <AITacticalAdvisor 
                gridData={grid} 
                algorithm={state.algorithm} 
                telemetry={telemetry} 
              />
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 space-y-12">
            {/* Grid Container */}
            <div className="glass-panel p-10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.05),transparent_70%)] pointer-events-none" />
              <div className="grid grid-cols-[repeat(40,minmax(0,1fr))] bg-black/60 p-2 rounded-2xl border border-white/5 relative z-10">
                {grid.map((row, rowIdx) => (
                  row.map((node, nodeIdx) => (
                    <Node
                      key={`${rowIdx}-${nodeIdx}`}
                      {...node}
                      onMouseDown={handleMouseDown}
                      onMouseEnter={handleMouseEnter}
                      onMouseUp={handleMouseUp}
                    />
                  ))
                ))}
              </div>
              
              {/* Grid Overlay Info */}
              <div className="absolute top-4 right-4 flex gap-4 z-20">
                <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-red rounded-full" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Optimization</span>
                </div>
                <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grid:</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{GRID_ROWS}x{GRID_COLS}</span>
                </div>
              </div>
            </div>

            {/* Telemetry Dashboard - Bento Grid */}
            <div className="bento-grid">
              {[
                { label: 'Sectors Analyzed', value: telemetry.nodesExplored, unit: 'SECTORS', color: 'text-white', icon: <Activity size={20} />, span: 'col-span-1' },
                { label: 'Optimal Racing Line', value: telemetry.trajectoryLength, unit: 'METERS', color: 'text-brand-red', icon: <Target size={20} />, span: 'col-span-1' },
                { label: 'Search Frontier', value: telemetry.frontierSize, unit: 'NODES', color: 'text-slate-400', icon: <Layers size={20} />, span: 'col-span-1' },
                { label: 'Compute Latency', value: telemetry.computeLatency, unit: 'MS', color: 'text-white', icon: <Timer size={20} />, span: 'col-span-1' },
              ].map((stat, idx) => (
                <div key={idx} className={cn("glass-panel p-8 flex flex-col justify-between group hover:border-white/20 transition-all", stat.span)}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{stat.label}</span>
                    <div className="text-slate-700 group-hover:text-brand-red transition-colors">{stat.icon}</div>
                  </div>
                  <div className="flex items-baseline gap-3 mt-6">
                    <span className={cn("text-5xl font-black tracking-tighter", stat.color)}>{stat.value}</span>
                    <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">{stat.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* System Logs */}
            <div className="glass-panel p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Terminal className="text-brand-red" size={18} />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Telemetry Feed</h3>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 bg-brand-red rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                </div>
              </div>
              <div className="space-y-4">
                {logs.map((log, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className="flex items-start gap-4 text-sm font-mono group"
                  >
                    <span className="text-slate-700 font-bold">[{new Date().toLocaleTimeString()}]</span>
                    <div className="flex flex-col">
                      <span className={cn(idx === 0 ? "text-white" : "text-slate-500", "leading-relaxed")}>{log}</span>
                      {idx === 0 && <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-[1px] bg-brand-red/30 mt-1" />}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
