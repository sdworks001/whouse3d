import React, { useState, useEffect } from 'react';
import { Package, Trash2, Edit, Save, Calendar, Scale, Layers, Lock, PlusCircle, X } from 'lucide-react';
import type { Bay, Item } from '../../types/warehouse';

interface InspectorPanelProps {
  selectedBay: Bay | null;
  rackName: string | null;
  levelIndex: number | null;
  rackId: string | null;
  rackLevelsCount: number | null;
  rackBaysCount: number | null;
  onUpdateBay: (bayId: string, updatedBay: Bay) => void;
  onUpdateRack: (rackId: string, levelsCount: number, baysCount: number) => void;
  onDeleteRack: (rackId: string) => void;
  onClose: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedBay,
  rackName,
  levelIndex,
  rackId,
  rackLevelsCount,
  rackBaysCount,
  onUpdateBay,
  onUpdateRack,
  onDeleteRack,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategory, setEditCategory] = useState<Item['category']>('General');
  const [editWeight, setEditWeight] = useState('');
  const [editQty, setEditQty] = useState(1);

  const [rackLevels, setRackLevels] = useState(4);
  const [rackBays, setRackBays] = useState(3);

  // Synchronize local edit fields when selectedBay changes
  useEffect(() => {
    if (selectedBay && selectedBay.item) {
      setEditName(selectedBay.item.name);
      setEditSku(selectedBay.item.sku);
      setEditCategory(selectedBay.item.category);
      setEditWeight(selectedBay.item.weight);
      setEditQty(selectedBay.item.quantity);
    } else {
      // Defaults for adding new items
      setEditName('');
      setEditSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setEditCategory('General');
      setEditWeight('100kg');
      setEditQty(1);
    }
    
    if (rackLevelsCount !== null) setRackLevels(rackLevelsCount);
    if (rackBaysCount !== null) setRackBays(rackBaysCount);
    
    setIsEditing(false);
  }, [selectedBay, rackLevelsCount, rackBaysCount]);

  if (!selectedBay) {
    return (
      <div className="overlay-panel inspector-panel">
        <div className="inspector-empty">
          <Package size={48} />
          <div>
            <h3>Telemetry Inspector</h3>
            <p>Click on a rack shelf or an item box to view real-time data, inspect SKU details, or modify placement status.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleStatusChange = (status: 'empty' | 'reserved' | 'occupied') => {
    if (status === 'empty') {
      onUpdateBay(selectedBay.id, {
        ...selectedBay,
        status: 'empty',
        item: undefined
      });
    } else if (status === 'reserved') {
      onUpdateBay(selectedBay.id, {
        ...selectedBay,
        status: 'reserved',
        item: undefined
      });
    } else if (status === 'occupied') {
      // Generate default item
      const newItem: Item = {
        sku: editSku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: editName || 'New General Cargo',
        category: editCategory,
        weight: editWeight || '150kg',
        quantity: editQty || 5,
        storedDate: new Date().toISOString().split('T')[0],
        color: getCategoryColor(editCategory)
      };
      onUpdateBay(selectedBay.id, {
        ...selectedBay,
        status: 'occupied',
        item: newItem
      });
    }
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSku || !editName) return;

    const updatedItem: Item = {
      sku: editSku,
      name: editName,
      category: editCategory,
      weight: editWeight,
      quantity: editQty,
      storedDate: selectedBay.item?.storedDate || new Date().toISOString().split('T')[0],
      color: getCategoryColor(editCategory)
    };

    onUpdateBay(selectedBay.id, {
      ...selectedBay,
      status: 'occupied',
      item: updatedItem
    });
    setIsEditing(false);
  };

  function getCategoryColor(category: Item['category']): string {
    switch (category) {
      case 'Electronics': return '#00d2ff';
      case 'Hazmat': return '#ff9900';
      case 'Fragile': return '#d500f9';
      case 'Cold Storage': return '#80deea';
      case 'General':
      default:
        return '#00e676';
    }
  }

  function getCategoryBadgeClass(category: Item['category']): string {
    return `category-badge badge-${category.toLowerCase().replace(' ', '')}`;
  }

  return (
    <div className="overlay-panel inspector-panel">
      <div className="panel-header">
        <h2>
          <Layers size={18} />
          Slot {selectedBay.id.split('-').pop()}
        </h2>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      <div className="panel-scrollable">
        {/* Slot Location Details */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
            <span>Rack Unit:</span>
            <span style={{ color: 'white', fontWeight: 600 }}>{rackName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '0.4rem' }}>
            <span>Shelf Level:</span>
            <span style={{ color: 'white', fontWeight: 600 }}>Level {levelIndex}</span>
          </div>
        </div>

        {/* Status Section */}
        <div>
          <span className="section-title">Operational Status</span>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              className={`btn-secondary ${selectedBay.status === 'empty' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', borderColor: selectedBay.status === 'empty' ? 'hsl(var(--accent-primary))' : '' }}
              onClick={() => handleStatusChange('empty')}
            >
              Empty
            </button>
            <button
              className={`btn-secondary ${selectedBay.status === 'reserved' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', borderColor: selectedBay.status === 'reserved' ? 'hsl(var(--accent-warning))' : '' }}
              onClick={() => handleStatusChange('reserved')}
            >
              Reserve
            </button>
            {selectedBay.status !== 'occupied' && (
              <button
                className="btn-primary"
                style={{ flex: 1.2, padding: '0.4rem', fontSize: '0.75rem' }}
                onClick={() => handleStatusChange('occupied')}
              >
                <PlusCircle size={14} /> Add Cargo
              </button>
            )}
          </div>
        </div>

        {/* Cargo Telemetry */}
        {selectedBay.status === 'occupied' && selectedBay.item && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-title">Cargo Telemetry</span>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ background: 'none', border: 'none', color: 'hsl(var(--accent-primary))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                >
                  <Edit size={12} /> Edit
                </button>
              )}
            </div>

            {!isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 600 }}>
                    {selectedBay.item.name}
                  </h3>
                  <span className={getCategoryBadgeClass(selectedBay.item.category)}>
                    {selectedBay.item.category}
                  </span>
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <label><Scale size={11} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} /> Weight</label>
                    <span>{selectedBay.item.weight}</span>
                  </div>
                  <div className="detail-item">
                    <label><Package size={11} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} /> Qty (Units)</label>
                    <span>{selectedBay.item.quantity}</span>
                  </div>
                  <div className="detail-item">
                    <label>SKU Number</label>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedBay.item.sku}</span>
                  </div>
                  <div className="detail-item">
                    <label><Calendar size={11} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} /> Stored Date</label>
                    <span>{selectedBay.item.storedDate}</span>
                  </div>
                </div>

                <button 
                  className="btn-secondary" 
                  style={{ color: 'hsl(var(--accent-danger))', borderColor: 'rgba(255, 53, 94, 0.2)', width: '100%', marginTop: '0.5rem' }}
                  onClick={() => handleStatusChange('empty')}
                >
                  <Trash2 size={14} /> De-register Cargo
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveDetails} className="editor-form">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    className="input-text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>SKU Code</label>
                  <input
                    type="text"
                    className="input-text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Product Category</label>
                  <select
                    className="select-input"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as Item['category'])}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Hazmat">Hazmat</option>
                    <option value="Fragile">Fragile</option>
                    <option value="General">General</option>
                    <option value="Cold Storage">Cold Storage</option>
                  </select>
                </div>

                <div className="detail-grid" style={{ margin: '0' }}>
                  <div className="form-group">
                    <label>Weight (e.g. 200kg)</label>
                    <input
                      type="text"
                      className="input-text"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      className="input-text"
                      value={editQty}
                      onChange={(e) => setEditQty(parseInt(e.target.value) || 1)}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1.5 }}
                  >
                    <Save size={14} /> Save
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {selectedBay.status === 'reserved' && (
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center', padding: '1rem', background: 'rgba(208, 135, 112, 0.05)', borderRadius: '8px', border: '1px dashed rgba(208, 135, 112, 0.2)' }}>
            <Lock size={20} style={{ color: 'hsl(var(--accent-warning))' }} />
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--accent-warning))', fontSize: '0.85rem' }}>Reserved Space</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                This bay has been marked as reserved for an incoming shipment. You can add cargo details to activate it, or release the reservation.
              </p>
            </div>
            <button 
              className="btn-primary" 
              style={{ width: '100%', fontSize: '0.75rem', padding: '0.5rem' }}
              onClick={() => handleStatusChange('occupied')}
            >
              Activate Slot & Add Cargo
            </button>
          </div>
        )}

        {/* Rack Structure Editor */}
        {rackId && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
            <span className="section-title">Rack Configuration</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
              <div className="control-group">
                <div className="control-label">
                  <span>Rack Levels</span>
                  <span>{rackLevels}</span>
                </div>
                <input
                  type="range"
                  className="slider-input"
                  min="2"
                  max="6"
                  step="1"
                  value={rackLevels}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 2;
                    setRackLevels(val);
                    onUpdateRack(rackId, val, rackBays);
                  }}
                />
              </div>

              <div className="control-group">
                <div className="control-label">
                  <span>Bays Count</span>
                  <span>{rackBays}</span>
                </div>
                <input
                  type="range"
                  className="slider-input"
                  min="2"
                  max="5"
                  step="1"
                  value={rackBays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 2;
                    setRackBays(val);
                    onUpdateRack(rackId, rackLevels, val);
                  }}
                />
              </div>

              <button 
                className="btn-secondary" 
                style={{ color: 'hsl(var(--accent-danger))', borderColor: 'rgba(255, 53, 94, 0.2)', width: '100%', marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.5rem' }}
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${rackName}?`)) {
                    onDeleteRack(rackId);
                  }
                }}
              >
                <Trash2 size={12} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> Delete Entire Rack
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
