import { useState } from 'react';
import { Database, Eye, Activity, HardDrive } from 'lucide-react';
import './App.css';
import { generateWarehouseLayout, calculateWarehouseStats, DEFAULT_LAYOUT_PARAMS } from './data/mockWarehouseData';
import type { WarehouseLayout, LayoutParameters, Bay, ShelfLevel } from './types/warehouse';
import { WarehouseCanvas } from './components/Three/WarehouseCanvas';
import { Dashboard } from './components/UI/Dashboard';
import { InspectorPanel } from './components/UI/InspectorPanel';

function App() {
  const [parameters, setParameters] = useState<LayoutParameters>(DEFAULT_LAYOUT_PARAMS);
  const [layout, setLayout] = useState<WarehouseLayout>(() => generateWarehouseLayout(DEFAULT_LAYOUT_PARAMS));
  const [selectedBayId, setSelectedBayId] = useState<string | null>(null);
  const [cameraView, setCameraView] = useState<'orbit' | 'top' | 'isometric' | 'aisle'>('orbit');
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiLoadMessage, setApiLoadMessage] = useState('');

  // Re-generate layout when parameter structure changes
  const handleGenerate = () => {
    const newLayout = generateWarehouseLayout(parameters);
    setLayout(newLayout);
    setSelectedBayId(null);
  };

  // Update a single bay in the layout state (handles Edit details, empty, reserve)
  const handleUpdateBay = (bayId: string, updatedBay: Bay) => {
    const updatedRacks = layout.racks.map((rack) => {
      // Find if this rack contains the bay
      const updatedLevels = rack.levels.map((level) => {
        const updatedBays = level.bays.map((bay) => {
          if (bay.id === bayId) {
            return updatedBay;
          }
          return bay;
        });
        return {
          ...level,
          bays: updatedBays
        };
      });
      return {
        ...rack,
        levels: updatedLevels
      };
    });

    setLayout({
      ...layout,
      racks: updatedRacks
    });
  };

  // Update an entire rack's dimensions (rebuilds shelf levels and bay slots)
  const handleUpdateRack = (rackId: string, levelsCount: number, baysCount: number) => {
    const updatedRacks = layout.racks.map((rack) => {
      if (rack.id === rackId) {
        const newLevels: ShelfLevel[] = [];
        for (let l = 0; l < levelsCount; l++) {
          const bays: Bay[] = [];
          const existingLevel = rack.levels.find(level => level.levelIndex === l);
          
          for (let b = 0; b < baysCount; b++) {
            const bayId = `${rackId}-L${l}-B${b}`;
            const existingBay = existingLevel?.bays.find(bay => bay.bayIndex === b);
            
            bays.push(existingBay || {
              id: bayId,
              bayIndex: b,
              status: 'empty'
            });
          }
          newLevels.push({
            levelIndex: l,
            yOffset: l * 1.8 + 0.5,
            bays
          });
        }
        
        const rackHeight = levelsCount * 1.8 + 0.5;
        const rackLength = baysCount * 3.2;

        return {
          ...rack,
          levelsCount,
          baysCount,
          levels: newLevels,
          height: rackHeight,
          length: rackLength
        };
      }
      return rack;
    });

    setLayout({
      ...layout,
      racks: updatedRacks
    });
  };

  // Find the currently selected bay object and its context details
  const getSelectedBayInfo = () => {
    if (!selectedBayId) return null;
    
    for (const rack of layout.racks) {
      for (const level of rack.levels) {
        for (const bay of level.bays) {
          if (bay.id === selectedBayId) {
            return {
              bay,
              rackId: rack.id,
              rackName: rack.name,
              levelIndex: level.levelIndex,
              rackLevelsCount: rack.levelsCount,
              rackBaysCount: rack.baysCount
            };
          }
        }
      }
    }
    return null;
  };

  // Simulate API GET fetch
  const handleSimulateFetch = () => {
    setIsLoadingApi(true);
    setApiLoadMessage('Querying Cloud API Endpoint...');
    
    setTimeout(() => {
      // Create random parameters
      const randomParams: LayoutParameters = {
        aislesCount: Math.floor(Math.random() * 3) + 2, // 2-4
        racksPerAisle: Math.floor(Math.random() * 3) + 3, // 3-5
        levelsPerRack: Math.floor(Math.random() * 3) + 3, // 3-5
        baysPerLevel: Math.floor(Math.random() * 2) + 3, // 3-4
        occupancyRate: Math.round((Math.random() * 0.4 + 0.4) * 100) / 100, // 40%-80%
        floorWidth: 60,
        floorLength: 80
      };
      
      setParameters(randomParams);
      setLayout(generateWarehouseLayout(randomParams));
      setSelectedBayId(null);
      
      setApiLoadMessage('Syncing WebGL buffer assets...');
      setTimeout(() => {
        setIsLoadingApi(false);
      }, 500);
    }, 1500);
  };

  // Simulate API PUT save
  const handleSaveToApi = () => {
    setIsLoadingApi(true);
    setApiLoadMessage('Serializing Twin telemetry payload...');
    
    setTimeout(() => {
      setApiLoadMessage('Pushing schema updates to API server...');
      
      setTimeout(() => {
        setIsLoadingApi(false);
        console.log('API payload sync completed successfully. Saved warehouse twin layout:', layout);
        alert('Digital Twin state successfully synced to Cloud API database!');
      }, 1000);
    }, 1000);
  };

  // Load custom JSON schema
  const handleLoadJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr) as WarehouseLayout;
      
      // Basic schema safety check
      if (parsed && Array.isArray(parsed.racks) && parsed.floor) {
        setLayout(parsed);
        setSelectedBayId(null);
        
        // Match sliders approximately
        const maxLevels = Math.max(...parsed.racks.map(r => r.levelsCount), 3);
        const maxBays = Math.max(...parsed.racks.map(r => r.baysCount), 3);
        
        setParameters({
          aislesCount: Math.min(parsed.aisles?.length || 3, 5),
          racksPerAisle: Math.round(parsed.racks.length / (2 * (parsed.aisles?.length || 1))) || 3,
          levelsPerRack: maxLevels,
          baysPerLevel: maxBays,
          occupancyRate: 0.6,
          floorWidth: parsed.floor.width || 60,
          floorLength: parsed.floor.length || 80
        });
        
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Calculate statistics
  const stats = calculateWarehouseStats(layout);
  const selectedInfo = getSelectedBayInfo();

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="dashboard-header">
        <div className="header-title-container">
          <div className="twin-dot" />
          <h1>{layout.warehouseName}</h1>
          <span style={{ fontSize: '0.65rem', background: 'rgba(0,255,100,0.1)', color: '#00ff66', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(0,255,100,0.2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '0.5rem' }}>
            Live Sync
          </span>
        </div>

        <div className="header-stats">
          <div className="header-stat-item">
            <span className="stat-label">System State</span>
            <span className="stat-value" style={{ color: '#00ff66', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Activity size={12} /> Active
            </span>
          </div>
          <div className="header-stat-item">
            <span className="stat-label">Capacity (Bays)</span>
            <span className="stat-value">{stats.occupiedBays} / {stats.totalCapacity}</span>
          </div>
          <div className="header-stat-item">
            <span className="stat-label">Occupancy Rate</span>
            <span className="stat-value">{Math.round(stats.occupancyRate * 100)}%</span>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="workspace-content">
        
        {/* Loading Spinner Overlays */}
        {isLoadingApi && (
          <div className="loading-api-overlay">
            <div className="spinner" />
            <div className="loading-text">{apiLoadMessage}</div>
          </div>
        )}

        {/* 3D WebGL Canvas Layer */}
        <WarehouseCanvas
          layout={layout}
          selectedBayId={selectedBayId}
          onSelectBay={setSelectedBayId}
          cameraView={cameraView}
        />

        {/* Dashboard Control panel overlay */}
        <Dashboard
          parameters={parameters}
          onUpdateParameters={setParameters}
          onGenerate={handleGenerate}
          onSimulateFetch={handleSimulateFetch}
          onSaveToApi={handleSaveToApi}
          stats={stats}
          layoutJson={layout}
          onLoadJson={handleLoadJson}
        />

        {/* Inspector Panel overlay */}
        <InspectorPanel
          selectedBay={selectedInfo ? selectedInfo.bay : null}
          rackName={selectedInfo ? selectedInfo.rackName : null}
          levelIndex={selectedInfo ? selectedInfo.levelIndex : null}
          rackId={selectedInfo ? selectedInfo.rackId : null}
          rackLevelsCount={selectedInfo ? selectedInfo.rackLevelsCount : null}
          rackBaysCount={selectedInfo ? selectedInfo.rackBaysCount : null}
          onUpdateBay={handleUpdateBay}
          onUpdateRack={handleUpdateRack}
          onClose={() => setSelectedBayId(null)}
        />

        {/* Floating Camera controls at bottom */}
        <div className="viewport-controls">
          <button
            className={`viewport-btn ${cameraView === 'orbit' ? 'active' : ''}`}
            onClick={() => setCameraView('orbit')}
          >
            <Eye size={12} /> Orbit View
          </button>
          <button
            className={`viewport-btn ${cameraView === 'isometric' ? 'active' : ''}`}
            onClick={() => setCameraView('isometric')}
          >
            <HardDrive size={12} /> Isometric
          </button>
          <button
            className={`viewport-btn ${cameraView === 'top' ? 'active' : ''}`}
            onClick={() => setCameraView('top')}
          >
            <Database size={12} /> Top Down
          </button>
          <button
            className={`viewport-btn ${cameraView === 'aisle' ? 'active' : ''}`}
            onClick={() => setCameraView('aisle')}
          >
            <Activity size={12} /> Forklift Path
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;
