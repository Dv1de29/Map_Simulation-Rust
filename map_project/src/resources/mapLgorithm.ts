type Point = {row: number, col: number}

type TerrainCosts = {
    [key: string]: number 
}

type PriorityQueueItem = [number, number, number, string];
// Represents an item in the priority queue: [cost, row, col, current_cell_terrain_type]

/**
 * Represents a cell with its cost: { cost: number; point: Point }
 */
type CellWithCost = { cost: number; point: Point };


class MinHeap {
  private heap: PriorityQueueItem[] = [];

  /**
   * Returns the number of elements in the heap.
   */
  size(): number {
    return this.heap.length;
  }

  /**
   * Inserts an item into the heap.
   * @param item The item to insert, of type PriorityQueueItem.
   */
  push(item: PriorityQueueItem): void {
    this.heap.push(item);
    this.bubbleUp();
  }

  /**
   * Removes and returns the item with the smallest cost (root of the heap).
   * @returns The item with the smallest cost, or undefined if the heap is empty.
   */
  pop(): PriorityQueueItem | undefined {
    if (this.heap.length === 0) {
      return undefined;
    }
    if (this.heap.length === 1) {
      return this.heap.pop();
    }

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!; // Move last element to root
    this.bubbleDown();
    return min;
  }

  /**
   * Restores the heap property by moving the last element up.
   * Used after pushing a new item.
   */
  private bubbleUp(): void {
    let index = this.heap.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex][0] > this.heap[index][0]) {
        // Swap if parent cost is greater than current item cost
        [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  /**
   * Restores the heap property by moving the root element down.
   * Used after popping the root item.
   */
  private bubbleDown(): void {
    let index = 0;
    const length = this.heap.length;
    const element = this.heap[0];

    while (true) {
      let leftChildIndex = 2 * index + 1;
      let rightChildIndex = 2 * index + 2;
      let leftChild: PriorityQueueItem | undefined;
      let rightChild: PriorityQueueItem | undefined;
      let swap: number | null = null;

      if (leftChildIndex < length) {
        leftChild = this.heap[leftChildIndex];
        if (leftChild[0] < element[0]) {
          swap = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        rightChild = this.heap[rightChildIndex];
        if (
          (swap === null && rightChild[0] < element[0]) ||
          (swap !== null && rightChild[0] < leftChild![0])
        ) {
          swap = rightChildIndex;
        }
      }

      if (swap === null) {
        break;
      }

      [this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]];
      index = swap;
    }
  }
}

class MaxHeap {
  private heap: CellWithCost[] = [];

  /**
   * Returns the number of elements in the heap.
   */
  size(): number {
    return this.heap.length;
  }

  /**
   * Returns the element with the largest cost (root of the heap) without removing it.
   * @returns The element with the largest cost, or undefined if the heap is empty.
   */
  peek(): CellWithCost | undefined {
    return this.heap.length > 0 ? this.heap[0] : undefined;
  }

  /**
   * Inserts an item into the heap.
   * @param item The item to insert, of type CellWithCost.
   */
  push(item: CellWithCost): void {
    this.heap.push(item);
    this.bubbleUp();
  }

  /**
   * Removes and returns the item with the largest cost (root of the heap).
   * @returns The item with the largest cost, or undefined if the heap is empty.
   */
  pop(): CellWithCost | undefined {
    if (this.heap.length === 0) {
      return undefined;
    }
    if (this.heap.length === 1) {
      return this.heap.pop();
    }

    const max = this.heap[0];
    this.heap[0] = this.heap.pop()!; // Move last element to root
    this.bubbleDown();
    return max;
  }

  /**
   * Restores the heap property by moving the last element up.
   * Used after pushing a new item.
   */
  private bubbleUp(): void {
    let index = this.heap.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      // Compare based on cost for MaxHeap
      if (this.heap[parentIndex].cost < this.heap[index].cost) {
        // Swap if parent cost is smaller than current item cost
        [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  /**
   * Restores the heap property by moving the root element down.
   * Used after popping the root item.
   */
  private bubbleDown(): void {
    let index = 0;
    const length = this.heap.length;
    const element = this.heap[0];

    while (true) {
      let leftChildIndex = 2 * index + 1;
      let rightChildIndex = 2 * index + 2;
      let leftChild: CellWithCost | undefined;
      let rightChild: CellWithCost | undefined;
      let swap: number | null = null;

      if (leftChildIndex < length) {
        leftChild = this.heap[leftChildIndex];
        // Compare based on cost for MaxHeap
        if (leftChild.cost > element.cost) {
          swap = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        rightChild = this.heap[rightChildIndex];
        // Compare based on cost for MaxHeap
        if (
          (swap === null && rightChild.cost > element.cost) ||
          (swap !== null && rightChild.cost > leftChild!.cost)
        ) {
          swap = rightChildIndex;
        }
      }

      if (swap === null) {
        break;
      }

      [this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]];
      index = swap;
    }
  }
}

interface PenaltyConfiguration{
  water_land: number,
  land_water: number,
  mountain: number,
  forest: number,
  desert: number,
  ice: number, 
}

const defaultPenaltyConfig = {
  water_land: 5,
  land_water: 10,
  mountain: 3,
  forest: 2,
  desert: 4,
  ice: 1, 
}


export function searchTer(
    terrainMap: string[][],
    startPoint: Point,
    costs: TerrainCosts,
    terrainChangePenalty: PenaltyConfiguration = defaultPenaltyConfig,
): Map<string, number>{
    const rows = terrainMap.length;
    const cols = terrainMap[0].length;

    if ( rows === 0 || cols === 0){
        return new Map()
    }

    const dist: Map<string, number> = new Map();
    for ( let r = 0; r < rows; r++ ){
        for ( let c = 0; c < cols; c++ ){
            dist.set(`${r}-${c}`, Infinity)
        }
    }

    const [startR, startC] = [startPoint.row, startPoint.col]

    const initialTerrain = terrainMap[startR][startC]
    dist.set(`${startR}-${startC}`, 0)

    const pq = new MinHeap()
    pq.push([0, startR, startC, initialTerrain])

    const dc = [ -1, 0, 0, 1]
    const dr = [ 0, -1, 1, 0]

    while( pq.size() > 0){
        const popped = pq.pop()
        if (!popped) continue

        const [currentCost, r, c, currentCellType ] = popped

        if ( currentCost > (dist.get(`${r}-${c}`) || Infinity)) continue

        for ( let i = 0; i < 4; i++ ){
            const nr = r + dr[i]
            const nc = c + dc[i]

            if ( nr < 0 || nr >= rows || nc < 0 || nc >= cols){
                continue
            }

            const neibType = terrainMap[nr][nc]
            const travelCost = costs[currentCellType] !== undefined ? costs[currentCellType] : Infinity

            let penalty = 0

            if ( ["W", "R"].includes(currentCellType) && !["W", "R"].includes(neibType) ){
              penalty += terrainChangePenalty.water_land
            }

            if ( !["W", "R"].includes(currentCellType) && ["W", "R"].includes(neibType) ){
              penalty += terrainChangePenalty.land_water
            }

            switch(neibType){
              case "M":
                penalty += terrainChangePenalty.mountain
                break;
              case "F":
                penalty += terrainChangePenalty.forest
                break;
              case "D":
                penalty += terrainChangePenalty.desert
                break;
              case "I":
                penalty += terrainChangePenalty.ice;
                break;
            }

            const newCost = currentCost + travelCost + penalty

            if ( (nr !== startR || nc !== startC) && newCost < (dist.get(`${nr}-${nc}`) || Infinity)){
                dist.set(`${nr}-${nc}`, newCost)
                pq.push([newCost, nr, nc, neibType])
            }
        }
    }

    return dist
}

export function findNClosestCells(
    allCosts: Map<string, number>,
    n: number,
    mapData: string[][]
): CellWithCost[]{
    const maxHeap = new MaxHeap();

  allCosts.forEach((cost, key) => {
    if (cost !== Infinity) { 
      const parts = key.split('-').map(Number);
      if (parts.length === 2) {
        if ( mapData[parts[0]][parts[1]] !== 'W'){
        const currentCell: CellWithCost = { cost: cost, point: {row: parts[0], col: parts[1]} };

        if (maxHeap.size() < n) {
          maxHeap.push(currentCell);
        } else if (maxHeap.peek() && currentCell.cost < maxHeap.peek()!.cost) {
          maxHeap.pop();
          maxHeap.push(currentCell);
        }
      }
      }
    }
  });

  const closestCells: CellWithCost[] = [];
  while (maxHeap.size() > 0) {
    closestCells.push(maxHeap.pop()!);
  }

  // return closestCells.map(cell => cell.point);
  return closestCells;
}