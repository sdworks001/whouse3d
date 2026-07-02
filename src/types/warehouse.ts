export interface Item {
  sku: string;
  name: string;
  category: 'Electronics' | 'Hazmat' | 'Fragile' | 'General' | 'Cold Storage';
  weight: string;
  quantity: number;
  storedDate: string;
  color: string; // Hex color for box rendering
}

export interface Bay {
  id: string; // e.g., rack-1-level-0-bay-2
  bayIndex: number;
  status: 'empty' | 'occupied' | 'reserved';
  item?: Item;
}

export interface ShelfLevel {
  levelIndex: number;
  yOffset: number; // Height offset from ground
  bays: Bay[];
}

export interface Rack {
  id: string;
  name: string;
  x: number;      // 3D X coordinate (left-right)
  z: number;      // 3D Z coordinate (front-back)
  y: number;      // 3D Y coordinate (usually 0 - ground)
  rotation: number; // Y rotation in radians (0 or Math.PI / 2)
  width: number;    // Width (X span)
  length: number;   // Length (Z span)
  height: number;   // Total Height (Y span)
  levelsCount: number;
  baysCount: number;
  levels: ShelfLevel[];
}

export interface Aisle {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  length: number;
  color?: string;
}

export interface Floor {
  width: number;
  length: number;
  gridSize: number;
}

export interface Forklift {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  path: [number, number][]; // Multi-section path waypoints [x, z]
  currentWaypointIndex: number;
  status: 'idle' | 'moving' | 'loading' | 'unloading';
  loadedItem?: string; // SKU
  speed: number;
}

export interface WarehouseLayout {
  warehouseName: string;
  floor: Floor;
  aisles: Aisle[];
  racks: Rack[];
  forklifts: Forklift[];
}

export interface WarehouseStats {
  totalCapacity: number;
  occupiedBays: number;
  reservedBays: number;
  emptyBays: number;
  occupancyRate: number;
  totalWeightKg: number;
  categoryDistribution: {
    Electronics: number;
    Hazmat: number;
    Fragile: number;
    General: number;
    'Cold Storage': number;
  };
}

export interface LayoutParameters {
  aislesCount: number;
  racksPerAisle: number;
  levelsPerRack: number;
  baysPerLevel: number;
  occupancyRate: number; // 0 to 1
  floorWidth: number;
  floorLength: number;
}
