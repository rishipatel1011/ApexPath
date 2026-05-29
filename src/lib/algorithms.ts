import { Node } from '../types';

// Pathfinding Algorithms
export function bfs(grid: Node[][], startNode: Node, finishNode: Node) {
  const visitedNodesInOrder: Node[] = [];
  const queue: Node[] = [startNode];
  startNode.isVisited = true;

  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    if (currentNode.objectType === 'BARRIER') continue;
    visitedNodesInOrder.push(currentNode);
    if (currentNode === finishNode) return visitedNodesInOrder;

    const neighbors = getNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && neighbor.objectType !== 'BARRIER') {
        neighbor.isVisited = true;
        neighbor.previousNode = currentNode;
        queue.push(neighbor);
      }
    }
  }
  return visitedNodesInOrder;
}

export function dfs(grid: Node[][], startNode: Node, finishNode: Node) {
  const visitedNodesInOrder: Node[] = [];
  const stack: Node[] = [startNode];
  
  while (stack.length > 0) {
    const currentNode = stack.pop()!;
    if (currentNode.objectType === 'BARRIER' || currentNode.isVisited) continue;
    
    currentNode.isVisited = true;
    visitedNodesInOrder.push(currentNode);
    if (currentNode === finishNode) return visitedNodesInOrder;

    const neighbors = getNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && neighbor.objectType !== 'BARRIER') {
        neighbor.previousNode = currentNode;
        stack.push(neighbor);
      }
    }
  }
  return visitedNodesInOrder;
}

export function dijkstra(grid: Node[][], startNode: Node, finishNode: Node) {
  const visitedNodesInOrder: Node[] = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);

  while (unvisitedNodes.length > 0) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift()!;
    if (closestNode.objectType === 'BARRIER') continue;
    if (closestNode.distance === Infinity) return visitedNodesInOrder;
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    if (closestNode === finishNode) return visitedNodesInOrder;
    updateUnvisitedNeighbors(closestNode, grid);
  }
  return visitedNodesInOrder;
}

export function astar(grid: Node[][], startNode: Node, finishNode: Node) {
  const visitedNodesInOrder: Node[] = [];
  startNode.distance = 0;
  startNode.heuristic = getManhattanDistance(startNode, finishNode);
  startNode.totalCost = startNode.distance + startNode.heuristic;
  
  const unvisitedNodes = getAllNodes(grid);

  while (unvisitedNodes.length > 0) {
    sortNodesByTotalCost(unvisitedNodes);
    const closestNode = unvisitedNodes.shift()!;
    if (closestNode.objectType === 'BARRIER') continue;
    if (closestNode.distance === Infinity) return visitedNodesInOrder;
    
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    if (closestNode === finishNode) return visitedNodesInOrder;
    
    const neighbors = getNeighbors(closestNode, grid);
    for (const neighbor of neighbors) {
      if (neighbor.isVisited || neighbor.objectType === 'BARRIER') continue;
      
      const weight = neighbor.objectType === 'OIL_SLICK' ? 10 : neighbor.objectType === 'WATER_PUDDLE' ? 5 : 1;
      const distanceToNeighbor = closestNode.distance + weight;
      if (distanceToNeighbor < neighbor.distance) {
        neighbor.distance = distanceToNeighbor;
        neighbor.heuristic = getManhattanDistance(neighbor, finishNode);
        neighbor.totalCost = neighbor.distance + neighbor.heuristic;
        neighbor.previousNode = closestNode;
      }
    }
  }
  return visitedNodesInOrder;
}

export function greedy(grid: Node[][], startNode: Node, finishNode: Node) {
  const visitedNodesInOrder: Node[] = [];
  startNode.heuristic = getManhattanDistance(startNode, finishNode);
  const unvisitedNodes = [startNode];
  startNode.isVisited = true;

  while (unvisitedNodes.length > 0) {
    unvisitedNodes.sort((a, b) => (a.heuristic || Infinity) - (b.heuristic || Infinity));
    const closestNode = unvisitedNodes.shift()!;
    
    if (closestNode.objectType === 'BARRIER') continue;
    visitedNodesInOrder.push(closestNode);
    if (closestNode === finishNode) return visitedNodesInOrder;

    const neighbors = getNeighbors(closestNode, grid);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && neighbor.objectType !== 'BARRIER') {
        neighbor.isVisited = true;
        neighbor.heuristic = getManhattanDistance(neighbor, finishNode);
        neighbor.previousNode = closestNode;
        unvisitedNodes.push(neighbor);
      }
    }
  }
  return visitedNodesInOrder;
}

export const bestFirstSearch = greedy;

export function hillClimbing(grid: Node[][], startNode: Node, finishNode: Node) {
  const visitedNodesInOrder: Node[] = [];
  let currentNode = startNode;
  
  while (currentNode !== finishNode) {
    currentNode.isVisited = true;
    visitedNodesInOrder.push(currentNode);
    
    const neighbors = getNeighbors(currentNode, grid).filter(n => !n.isVisited && n.objectType !== 'BARRIER');
    if (neighbors.length === 0) break;
    
    // Sort by heuristic and pick the best
    neighbors.sort((a, b) => getManhattanDistance(a, finishNode) - getManhattanDistance(b, finishNode));
    const nextNode = neighbors[0];
    
    if (getManhattanDistance(nextNode, finishNode) >= getManhattanDistance(currentNode, finishNode)) {
      // Local optimum reached
      break;
    }
    
    nextNode.previousNode = currentNode;
    currentNode = nextNode;
  }
  
  if (currentNode === finishNode) {
    visitedNodesInOrder.push(finishNode);
  }
  
  return visitedNodesInOrder;
}

export function beamSearch(grid: Node[][], startNode: Node, finishNode: Node, beamWidth: number = 2) {
  const visitedNodesInOrder: Node[] = [];
  let beam = [startNode];
  startNode.isVisited = true;

  while (beam.length > 0) {
    const nextBeam: Node[] = [];
    
    for (const node of beam) {
      visitedNodesInOrder.push(node);
      if (node === finishNode) return visitedNodesInOrder;
      
      const neighbors = getNeighbors(node, grid).filter(n => !n.isVisited && n.objectType !== 'BARRIER');
      for (const neighbor of neighbors) {
        neighbor.isVisited = true;
        neighbor.previousNode = node;
        nextBeam.push(neighbor);
      }
    }
    
    // Sort all candidates for next beam and prune
    nextBeam.sort((a, b) => getManhattanDistance(a, finishNode) - getManhattanDistance(b, finishNode));
    beam = nextBeam.slice(0, beamWidth);
  }
  
  return visitedNodesInOrder;
}

export function simulatedAnnealing(grid: Node[][], startNode: Node, finishNode: Node) {
  const visitedNodesInOrder: Node[] = [];
  let currentNode = startNode;
  let temperature = 100;
  const coolingRate = 0.95;

  while (currentNode !== finishNode && temperature > 0.1) {
    currentNode.isVisited = true;
    visitedNodesInOrder.push(currentNode);

    const neighbors = getNeighbors(currentNode, grid).filter(n => !n.isVisited && n.objectType !== 'BARRIER');
    if (neighbors.length === 0) break;

    const nextNode = neighbors[Math.floor(Math.random() * neighbors.length)];
    const currentDist = getManhattanDistance(currentNode, finishNode);
    const nextDist = getManhattanDistance(nextNode, finishNode);

    if (nextDist < currentDist || Math.random() < Math.exp((currentDist - nextDist) / temperature)) {
      nextNode.previousNode = currentNode;
      currentNode = nextNode;
    }
    temperature *= coolingRate;
  }
  
  if (currentNode === finishNode) visitedNodesInOrder.push(finishNode);
  return visitedNodesInOrder;
}

export function geneticAlgorithm(grid: Node[][], startNode: Node, finishNode: Node) {
  // Simplified genetic approach for visualization: multiple probes evolving
  const visitedNodesInOrder: Node[] = [];
  let population = [startNode];
  startNode.isVisited = true;

  for (let generation = 0; generation < 50; generation++) {
    const nextGen: Node[] = [];
    for (const parent of population) {
      visitedNodesInOrder.push(parent);
      if (parent === finishNode) return visitedNodesInOrder;

      const neighbors = getNeighbors(parent, grid).filter(n => !n.isVisited && n.objectType !== 'BARRIER');
      for (const neighbor of neighbors) {
        neighbor.isVisited = true;
        neighbor.previousNode = parent;
        nextGen.push(neighbor);
      }
    }
    // Selection: keep those closer to finish
    nextGen.sort((a, b) => getManhattanDistance(a, finishNode) - getManhattanDistance(b, finishNode));
    population = nextGen.slice(0, 5);
    if (population.length === 0) break;
  }
  return visitedNodesInOrder;
}

// Helpers
function getNeighbors(node: Node, grid: Node[][]) {
  const neighbors: Node[] = [];
  const { col, row } = node;
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  return neighbors;
}

function getAllNodes(grid: Node[][]) {
  const nodes: Node[] = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
}

function sortNodesByDistance(unvisitedNodes: Node[]) {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
}

function sortNodesByTotalCost(unvisitedNodes: Node[]) {
  unvisitedNodes.sort((nodeA, nodeB) => (nodeA.totalCost || Infinity) - (nodeB.totalCost || Infinity));
}

function updateUnvisitedNeighbors(node: Node, grid: Node[][]) {
  const unvisitedNeighbors = getNeighbors(node, grid).filter(neighbor => !neighbor.isVisited);
  for (const neighbor of unvisitedNeighbors) {
    const weight = neighbor.objectType === 'OIL_SLICK' ? 10 : neighbor.objectType === 'WATER_PUDDLE' ? 5 : 1;
    neighbor.distance = node.distance + weight;
    neighbor.previousNode = node;
  }
}

function getManhattanDistance(nodeA: Node, nodeB: Node) {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

export function getNodesInShortestPathOrder(finishNode: Node) {
  const nodesInShortestPathOrder: Node[] = [];
  let currentNode: Node | null = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
}
