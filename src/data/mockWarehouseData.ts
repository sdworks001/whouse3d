import type { WarehouseLayout, WarehouseStats, LayoutParameters, Rack, Aisle, ShelfLevel, Bay, Item, Forklift } from '../types/warehouse';

const ITEM_TEMPLATES: Omit<Item, 'storedDate' | 'quantity'>[] = [
  { sku: 'EL-9821', name: 'Microcontrollers & PCBs', category: 'Electronics', weight: '120kg', color: '#00d2ff' },
  { sku: 'EL-4402', name: 'Lithium Battery Packs', category: 'Electronics', weight: '340kg', color: '#0072ff' },
  { sku: 'EL-1109', name: 'LED Display Panels', category: 'Electronics', weight: '210kg', color: '#1a8fe3' },
  
  { sku: 'HZ-3091', name: 'Industrial Cleansing Solvents', category: 'Hazmat', weight: '450kg', color: '#ff9900' },
  { sku: 'HZ-8820', name: 'Compressed Argon Cylinders', category: 'Hazmat', weight: '600kg', color: '#ff5500' },
  
  { sku: 'FR-0912', name: 'Optical Glass Lenses', category: 'Fragile', weight: '45kg', color: '#d500f9' },
  { sku: 'FR-7711', name: 'Precision Calibrators', category: 'Fragile', weight: '85kg', color: '#ba68c8' },
  
  { sku: 'GN-4410', name: 'Stainless Fasteners (M12)', category: 'General', weight: '800kg', color: '#00e676' },
  { sku: 'GN-2201', name: 'Corrugated Packaging Materials', category: 'General', weight: '150kg', color: '#81c784' },
  { sku: 'GN-8843', name: 'Polyester Strapping Reels', category: 'General', weight: '220kg', color: '#4caf50' },
  
  { sku: 'CS-0041', name: 'Frozen Vaccine Flasks', category: 'Cold Storage', weight: '30kg', color: '#e0f7fa' },
  { sku: 'CS-9912', name: 'Perishable Bio-Samples', category: 'Cold Storage', weight: '15kg', color: '#80deea' }
];

export const DEFAULT_LAYOUT_PARAMS: LayoutParameters = {
  aislesCount: 3,
  racksPerAisle: 4,
  levelsPerRack: 4,
  baysPerLevel: 3,
  occupancyRate: 0.65,
  floorWidth: 60,
  floorLength: 80
};

// Generates a mock item
function createMockItem(categoryFilter?: string): Item {
  const templates = categoryFilter 
    ? ITEM_TEMPLATES.filter(t => t.category === categoryFilter)
    : ITEM_TEMPLATES;
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  const randomDaysAgo = Math.floor(Math.random() * 60);
  const date = new Date();
  date.setDate(date.getDate() - randomDaysAgo);
  
  return {
    ...template,
    quantity: Math.floor(Math.random() * 40) + 5,
    storedDate: date.toISOString().split('T')[0]
  };
}

export function generateWarehouseLayout(params: LayoutParameters): WarehouseLayout {
  const { aislesCount, racksPerAisle, levelsPerRack, baysPerLevel, occupancyRate, floorWidth, floorLength } = params;
  
  const aisles: Aisle[] = [];
  const racks: Rack[] = [];
  
  // Calculate positioning parameters
  const aisleSpacing = floorWidth / (aislesCount + 1);
  const rackWidth = 2.5;  // Depth of a rack along X axis
  
  const rackSpacingZ = floorLength / (racksPerAisle + 1);
  
  // Generate Aisles and Racks
  for (let a = 0; a < aislesCount; a++) {
    const aisleX = -floorWidth / 2 + (a + 1) * aisleSpacing;
    const aisleId = `aisle-${a + 1}`;
    
    aisles.push({
      id: aisleId,
      name: `Aisle ${String.fromCharCode(65 + a)}`, // Aisle A, B, C...
      x: aisleX,
      z: 0,
      width: 5,
      length: floorLength - 10,
      color: 'rgba(255, 235, 59, 0.15)' // Warning yellow highlighted path
    });
    
    // Flanking racks (Left side and Right side of this Aisle)
    // Left row of racks
    const rackLeftX = aisleX - 4.5;
    // Right row of racks
    const rackRightX = aisleX + 4.5;
    
    const columns = [
      { x: rackLeftX, suffix: 'L', rotation: 0 },
      { x: rackRightX, suffix: 'R', rotation: 0 }
    ];
    
    columns.forEach((col) => {
      for (let r = 0; r < racksPerAisle; r++) {
        // Space them along Z
        const rackZ = -floorLength / 2 + (r + 1) * rackSpacingZ;
        const rackId = `rack-${a + 1}${col.suffix}-${r + 1}`;

        // Introduce rack size variation
        const levelsVar = (r % 2 === 0) ? 0 : (r % 3 === 0) ? -1 : 1;
        const finalLevels = Math.max(2, Math.min(6, levelsPerRack + levelsVar));
        
        const baysVar = (r % 2 === 0) ? 0 : ((r + a) % 2 === 0) ? -1 : 1;
        const finalBays = Math.max(2, Math.min(5, baysPerLevel + baysVar));

        const rackHeight = finalLevels * 1.8 + 0.5;
        const rackLength = finalBays * 3.2;
        
        const levels: ShelfLevel[] = [];
        for (let l = 0; l < finalLevels; l++) {
          const bays: Bay[] = [];
          for (let b = 0; b < finalBays; b++) {
            const bayId = `${rackId}-L${l}-B${b}`;
            const rand = Math.random();
            let status: 'empty' | 'occupied' | 'reserved' = 'empty';
            let item: Item | undefined = undefined;
            
            if (rand < occupancyRate) {
              status = 'occupied';
              item = createMockItem();
            } else if (rand < occupancyRate + 0.1) {
              status = 'reserved';
            }
            
            bays.push({
              id: bayId,
              bayIndex: b,
              status,
              item
            });
          }
          
          levels.push({
            levelIndex: l,
            yOffset: l * 1.8 + 0.5, // Bottom level starts slightly off the ground
            bays
          });
        }
        
        racks.push({
          id: rackId,
          name: `Rack ${String.fromCharCode(65 + a)}${r + 1}-${col.suffix}`,
          x: col.x,
          z: rackZ,
          y: 0,
          rotation: col.rotation,
          width: rackWidth,
          length: rackLength,
          height: rackHeight,
          levelsCount: finalLevels,
          baysCount: finalBays,
          levels
        });
      }
    });
  }
  
  // Generate Forklifts
  const aisleAX = aisles[0]?.x || -15;
  const aisleBX = aisles[1]?.x || 0;
  const aisleCX = aisles[aislesCount - 1]?.x || 15;
  
  const dockZ = floorLength / 2 - 3;
  const bottomZ = -floorLength / 2 + 10;
  const topZ = floorLength / 2 - 15;
  
  // Forklift Alpha Path: Aisle A -> Staging Dock 1 -> Aisle B -> Aisle A
  const path1: [number, number][] = [
    [aisleAX, bottomZ],
    [aisleAX, topZ],
    [-15, dockZ], // Staging Dock Left
    [aisleBX, topZ],
    [aisleBX, bottomZ]
  ];
  
  // Forklift Beta Path: Aisle C -> Staging Dock 2 -> Aisle B -> Aisle C
  const path2: [number, number][] = [
    [aisleCX, topZ],
    [aisleCX, bottomZ],
    [15, dockZ],  // Staging Dock Right
    [aisleBX, bottomZ],
    [aisleBX, topZ]
  ];

  const forklifts: Forklift[] = [
    {
      id: 'forklift-1',
      name: 'Forklift Alpha',
      x: aisleAX,
      y: 0,
      z: bottomZ,
      path: path1,
      currentWaypointIndex: 0,
      status: 'moving',
      loadedItem: ITEM_TEMPLATES[0].sku,
      speed: 0.12
    },
    {
      id: 'forklift-2',
      name: 'Forklift Beta',
      x: aisleCX,
      y: 0,
      z: topZ,
      path: path2,
      currentWaypointIndex: 0,
      status: 'moving',
      speed: 0.1
    }
  ];
  
  return {
    warehouseName: 'Apex 3D Logistics Twin',
    floor: {
      width: floorWidth,
      length: floorLength,
      gridSize: 2
    },
    aisles,
    racks,
    forklifts
  };
}

export function calculateWarehouseStats(layout: WarehouseLayout): WarehouseStats {
  let totalCapacity = 0;
  let occupiedBays = 0;
  let reservedBays = 0;
  let emptyBays = 0;
  let totalWeightKg = 0;
  
  const categoryDistribution = {
    Electronics: 0,
    Hazmat: 0,
    Fragile: 0,
    General: 0,
    'Cold Storage': 0
  };
  
  layout.racks.forEach((rack) => {
    rack.levels.forEach((level) => {
      level.bays.forEach((bay) => {
        totalCapacity++;
        if (bay.status === 'occupied') {
          occupiedBays++;
          if (bay.item) {
            categoryDistribution[bay.item.category]++;
            const w = parseInt(bay.item.weight.replace('kg', '')) || 0;
            totalWeightKg += w;
          }
        } else if (bay.status === 'reserved') {
          reservedBays++;
        } else {
          emptyBays++;
        }
      });
    });
  });
  
  const occupancyRate = totalCapacity > 0 ? occupiedBays / totalCapacity : 0;
  
  return {
    totalCapacity,
    occupiedBays,
    reservedBays,
    emptyBays,
    occupancyRate,
    totalWeightKg,
    categoryDistribution
  };
}
