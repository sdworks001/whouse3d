import React, { useState } from 'react';
import { Settings, RefreshCw, Database, Cloud, Code, ChevronDown, ChevronUp, Download } from 'lucide-react';
import type { LayoutParameters, WarehouseStats, WarehouseLayout } from '../../types/warehouse';

interface DashboardProps {
  parameters: LayoutParameters;
  onUpdateParameters: (params: LayoutParameters) => void;
  onGenerate: () => void;
  onSimulateFetch: () => void;
  onSaveToApi: () => void;
  stats: WarehouseStats;
  layoutJson: WarehouseLayout;
  onLoadJson: (jsonStr: string) => boolean;
  onAddRack: (name: string, x: number, z: number, rotation: number, levels: number, bays: number) => void;
  onClearFloor: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  parameters,
  onUpdateParameters,
  onGenerate,
  onSimulateFetch,
  onSaveToApi,
  stats,
  layoutJson,
  onLoadJson,
  onAddRack,
  onClearFloor
}) => {
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Construction State
  const [newRackName, setNewRackName] = useState('Rack C1');
  const [newRackX, setNewRackX] = useState(0);
  const [newRackZ, setNewRackZ] = useState(0);
  const [newRackRotation, setNewRackRotation] = useState(0);
  const [newRackLevels, setNewRackLevels] = useState(4);
  const [newRackBays, setNewRackBays] = useState(3);

  const handleCreateRackClick = () => {
    if (!newRackName.trim()) {
      alert('Please enter a rack identifier name');
      return;
    }
    onAddRack(
      newRackName,
      newRackX,
      newRackZ,
      newRackRotation,
      newRackLevels,
      newRackBays
    );
    // Auto increment default name for next rack
    setNewRackName(prev => {
      const match = prev.match(/(\d+)$/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        return prev.replace(/\d+$/, String(nextNum));
      }
      return prev + ' 1';
    });
  };

  const handleSliderChange = (key: keyof LayoutParameters, val: number) => {
    onUpdateParameters({
      ...parameters,
      [key]: val
    });
  };

  const handleJsonToggle = () => {
    if (!jsonOpen) {
      // populate textarea with current layout JSON
      setJsonInput(JSON.stringify(layoutJson, null, 2));
      setJsonError(null);
    }
    setJsonOpen(!jsonOpen);
  };

  const handleJsonSubmit = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.floor || !parsed.racks || !parsed.aisles) {
        setJsonError('Invalid schema: Missing floor, racks or aisles keys');
        return;
      }
      const success = onLoadJson(jsonInput);
      if (success) {
        setJsonError(null);
        alert('Warehouse layout successfully loaded from custom schema!');
      } else {
        setJsonError('Failed to load. Verify layout schema structure.');
      }
    } catch (e: any) {
      setJsonError(`JSON Parse Error: ${e.message}`);
    }
  };

  return (
    <div className="overlay-panel controls-panel">
      <div className="panel-header">
        <h2>
          <Settings size={18} />
          Digital Twin Controls
        </h2>
      </div>

      <div className="panel-scrollable">
        {/* Procedural Generation Parameters */}
        <div>
          <span className="section-title">Procedural Spawning</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            
            <div className="control-group">
              <div className="control-label">
                <span>Number of Aisles</span>
                <span>{parameters.aislesCount}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="1"
                max="5"
                step="1"
                value={parameters.aislesCount}
                onChange={(e) => handleSliderChange('aislesCount', parseInt(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>Racks Per Aisle Column</span>
                <span>{parameters.racksPerAisle}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="2"
                max="6"
                step="1"
                value={parameters.racksPerAisle}
                onChange={(e) => handleSliderChange('racksPerAisle', parseInt(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>Shelf Levels Per Rack</span>
                <span>{parameters.levelsPerRack}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="2"
                max="6"
                step="1"
                value={parameters.levelsPerRack}
                onChange={(e) => handleSliderChange('levelsPerRack', parseInt(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>Bays Per Level</span>
                <span>{parameters.baysPerLevel}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="2"
                max="5"
                step="1"
                value={parameters.baysPerLevel}
                onChange={(e) => handleSliderChange('baysPerLevel', parseInt(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>Target Occupancy</span>
                <span>{Math.round(parameters.occupancyRate * 100)}%</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="0.1"
                max="0.9"
                step="0.05"
                value={parameters.occupancyRate}
                onChange={(e) => handleSliderChange('occupancyRate', parseFloat(e.target.value))}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button className="btn-secondary" onClick={onClearFloor} style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem' }}>
                Clear Floor
              </button>
              <button className="btn-primary" onClick={onGenerate} style={{ flex: 1.2, fontSize: '0.75rem', padding: '0.5rem' }}>
                <RefreshCw size={12} /> Auto Populate
              </button>
            </div>
          </div>
        </div>

        {/* Construction Tools - Add Rack-by-Rack */}
        <div>
          <span className="section-title">Construction Mode</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
            
            <div className="form-group">
              <label style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))' }}>Rack Identifier</label>
              <input
                type="text"
                className="input-text"
                style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                value={newRackName}
                onChange={(e) => setNewRackName(e.target.value)}
                placeholder="e.g. Rack Custom 1"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="control-group">
                <div className="control-label" style={{ fontSize: '0.65rem' }}>
                  <span>Position X</span>
                  <span>{newRackX}m</span>
                </div>
                <input
                  type="range"
                  className="slider-input"
                  min="-25"
                  max="25"
                  step="1"
                  value={newRackX}
                  onChange={(e) => setNewRackX(parseInt(e.target.value))}
                />
              </div>
              <div className="control-group">
                <div className="control-label" style={{ fontSize: '0.65rem' }}>
                  <span>Position Z</span>
                  <span>{newRackZ}m</span>
                </div>
                <input
                  type="range"
                  className="slider-input"
                  min="-35"
                  max="35"
                  step="1"
                  value={newRackZ}
                  onChange={(e) => setNewRackZ(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))' }}>Orientation</label>
                <select
                  className="select-input"
                  style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                  value={newRackRotation}
                  onChange={(e) => setNewRackRotation(parseFloat(e.target.value))}
                >
                  <option value="0">Parallel (0°)</option>
                  <option value={String(Math.PI / 2)}>Perpendicular (90°)</option>
                </select>
              </div>
              <div className="control-group">
                <div className="control-label" style={{ fontSize: '0.65rem' }}>
                  <span>Levels</span>
                  <span>{newRackLevels}</span>
                </div>
                <input
                  type="range"
                  className="slider-input"
                  min="2"
                  max="6"
                  step="1"
                  value={newRackLevels}
                  onChange={(e) => setNewRackLevels(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="control-group">
              <div className="control-label" style={{ fontSize: '0.65rem' }}>
                <span>Bays Count</span>
                <span>{newRackBays}</span>
              </div>
              <input
                type="range"
                className="slider-input"
                min="2"
                max="5"
                step="1"
                value={newRackBays}
                onChange={(e) => setNewRackBays(parseInt(e.target.value))}
              />
            </div>

            <button 
              className="btn-primary" 
              style={{ fontSize: '0.75rem', padding: '0.5rem', marginTop: '0.2rem' }}
              onClick={handleCreateRackClick}
            >
              Construct Rack Unit
            </button>
          </div>
        </div>

        {/* Mock API Sync Operations */}
        <div>
          <span className="section-title">Cloud Integration (API)</span>
          <div className="button-grid" style={{ marginTop: '0.5rem' }}>
            <button className="btn-secondary" onClick={onSimulateFetch}>
              <Database size={14} /> Fetch API
            </button>
            <button className="btn-secondary" onClick={onSaveToApi}>
              <Cloud size={14} /> Sync Twin
            </button>
          </div>
        </div>

        {/* Inventory Statistics */}
        <div>
          <span className="section-title">Telemetry Summary</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>Total Cargo Bays:</span>
              <span style={{ fontWeight: 600 }}>{stats.totalCapacity}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>Occupied Slots:</span>
              <span style={{ color: 'hsl(var(--accent-success))', fontWeight: 600 }}>{stats.occupiedBays} ({Math.round(stats.occupancyRate * 100)}%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>Reserved Slots:</span>
              <span style={{ color: 'hsl(var(--accent-warning))', fontWeight: 600 }}>{stats.reservedBays}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>Total Gross Weight:</span>
              <span style={{ fontWeight: 600 }}>{(stats.totalWeightKg / 1000).toFixed(1)} metric tons</span>
            </div>
          </div>
        </div>

        {/* Cargo Categories Color Legend */}
        <div>
          <span className="section-title">Color Legend</span>
          <div className="legend-grid">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#00d2ff' }}></div>
              <span>Electronics</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ff9900' }}></div>
              <span>Hazmat</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#d500f9' }}></div>
              <span>Fragile</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#00e676' }}></div>
              <span>General Cargo</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#80deea' }}></div>
              <span>Cold Storage</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ border: '1px dashed rgba(255,255,255,0.3)', backgroundColor: 'transparent' }}></div>
              <span>Empty / Wireframe</span>
            </div>
          </div>
        </div>

        {/* Raw JSON Schema Editor */}
        <div className="json-collapsible">
          <button className="json-trigger" onClick={handleJsonToggle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Code size={12} />
              Raw API Schema (JSON)
            </span>
            {jsonOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {jsonOpen && (
            <div className="json-content">
              <textarea
                className="json-textarea"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste warehouse JSON schema here..."
              />
              {jsonError && <div className="json-error">{jsonError}</div>}
              <button 
                className="btn-primary" 
                onClick={handleJsonSubmit}
                style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.5rem' }}
              >
                <Download size={12} /> Load Custom Layout Schema
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
