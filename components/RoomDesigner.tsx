import React, { useState, useRef, useEffect } from 'react';
import { ImageUpload } from './ImageUpload';
import { DesignerItem, SavedDesign } from '../types';

const FURNITURE_ITEMS = [
  { type: 'Sofa', icon: '🛋️' },
  { type: 'Chair', icon: '🪑' },
  { type: 'Bed', icon: '🛏️' },
  { type: 'Plant', icon: '🪴' },
  { type: 'Lamp', icon: '💡' },
  { type: 'Art', icon: '🖼️' },
  { type: 'Rug', icon: '🧶' },
  { type: 'Vase', icon: '🏺' },
  { type: 'Books', icon: '📚' },
  { type: 'Clock', icon: '🕰️' },
  { type: 'TV', icon: '📺' },
  { type: 'Mirror', icon: '🪞' },
  { type: 'Window', icon: '🪟' },
  { type: 'Door', icon: '🚪' },
  { type: 'Table', icon: '桌' },
  { type: 'Wardrobe', icon: '🚪' },
  { type: 'Toilet', icon: '🚽' },
  { type: 'Shower', icon: '🚿' },
  { type: 'Bathtub', icon: '🛁' },
];

const TEMPLATES = [
  // Living Rooms
  { name: 'Modern Living', category: 'Living', url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Boho Lounge', category: 'Living', url: 'https://images.unsplash.com/photo-1522444195799-478538b28823?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Minimalist Hall', category: 'Living', url: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  
  // Bedrooms
  { name: 'Cozy Bedroom', category: 'Bedroom', url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Master Suite', category: 'Bedroom', url: 'https://images.unsplash.com/photo-1616594039964-40891a91295f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Kids Room', category: 'Bedroom', url: 'https://images.unsplash.com/photo-1516054575922-f0b8eead426f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },

  // Kitchen & Dining
  { name: 'Modern Kitchen', category: 'Kitchen', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Dining Area', category: 'Kitchen', url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Rustic Kitchen', category: 'Kitchen', url: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },

  // Office
  { name: 'Home Office', category: 'Office', url: 'https://images.unsplash.com/photo-1593642532400-2682810df593?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Open Workspace', category: 'Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Creative Studio', category: 'Office', url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },

  // Empty / Unfurnished (Good for designing)
  { name: 'Empty Corner', category: 'Empty', url: 'https://images.unsplash.com/photo-1505693416388-b0346ef1212b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Empty Room', category: 'Empty', url: 'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'White Walls', category: 'Empty', url: 'https://images.unsplash.com/photo-1558211583-03ed8a0b3d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
];

const CATEGORIES = ['All', 'Living', 'Bedroom', 'Kitchen', 'Office', 'Empty'];

export const RoomDesigner: React.FC = () => {
  const [background, setBackground] = useState<string | null>(null);
  const [items, setItems] = useState<DesignerItem[]>([]);
  // We now track multiple selected IDs
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const initialItemsStateRef = useRef<DesignerItem[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load saved designs
  useEffect(() => {
    const saved = localStorage.getItem('dreamspace_designs');
    if (saved) {
      try {
        setSavedDesigns(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved designs", e);
      }
    }
  }, []);

  // --- Persistence ---
  const handleSaveDesign = () => {
    if (!background) return;
    const name = prompt("Enter a name for your design:", `Design ${savedDesigns.length + 1}`);
    if (!name) return;

    const newDesign: SavedDesign = {
      id: Date.now(),
      name,
      date: new Date().toLocaleDateString(),
      background,
      items
    };

    const updatedDesigns = [newDesign, ...savedDesigns];
    setSavedDesigns(updatedDesigns);
    localStorage.setItem('dreamspace_designs', JSON.stringify(updatedDesigns));
  };

  const handleLoadDesign = (design: SavedDesign) => {
    if (window.confirm("Load this design? Unsaved changes will be lost.")) {
      setBackground(design.background);
      setItems(design.items);
      setSelectedItemIds([]);
    }
  };

  const handleDeleteDesign = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm("Delete this saved design?")) {
      const updated = savedDesigns.filter(d => d.id !== id);
      setSavedDesigns(updated);
      localStorage.setItem('dreamspace_designs', JSON.stringify(updated));
    }
  };

  const handleExportDesigns = () => {
    if (savedDesigns.length === 0) {
      alert("No designs to export.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedDesigns));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "dreamspace_designs.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportDesigns = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content);
        
        if (!Array.isArray(imported)) {
          throw new Error("Invalid file format: content is not an array");
        }
        
        // Basic schema check for the first item if exists
        if (imported.length > 0 && (!imported[0].id || !imported[0].items)) {
           throw new Error("Invalid design format");
        }

        // Filter duplicates based on ID
        const currentIds = new Set(savedDesigns.map(d => d.id));
        const newDesigns = imported.filter((d: SavedDesign) => !currentIds.has(d.id));

        if (newDesigns.length === 0) {
          alert("No new designs found (duplicates skipped).");
          return;
        }

        const updatedDesigns = [...newDesigns, ...savedDesigns];
        setSavedDesigns(updatedDesigns);
        localStorage.setItem('dreamspace_designs', JSON.stringify(updatedDesigns));
        alert(`Successfully imported ${newDesigns.length} designs.`);
      } catch (err) {
        console.error(err);
        alert("Failed to import: Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // --- Item Management ---
  const handleAddItem = (icon: string, type: string) => {
    if (!background) return;
    
    const newItem: DesignerItem = {
      id: Date.now(),
      type,
      icon,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      locked: false
    };
    
    setItems([...items, newItem]);
    setSelectedItemIds([newItem.id]);
  };

  const handleDeleteSelected = () => {
    if (selectedItemIds.length > 0) {
      setItems(items.filter(i => !selectedItemIds.includes(i.id)));
      setSelectedItemIds([]);
    }
  };

  const updateSelectedItems = (updates: Partial<DesignerItem>) => {
    setItems(items.map(i => selectedItemIds.includes(i.id) ? { ...i, ...updates } : i));
  };

  // --- Grouping & Locking ---
  const handleToggleLock = () => {
    const allLocked = selectedItems.every(i => i.locked);
    updateSelectedItems({ locked: !allLocked });
  };

  const handleGroup = () => {
    if (selectedItemIds.length < 2) return;
    const groupId = `group-${Date.now()}`;
    updateSelectedItems({ groupId });
  };

  const handleUngroup = () => {
    setItems(items.map(i => selectedItemIds.includes(i.id) ? { ...i, groupId: undefined } : i));
  };

  const handleLayer = (direction: 'up' | 'down') => {
    // Simple layering: move the selected items to end (top) or beginning (bottom) of array
    const selected = items.filter(i => selectedItemIds.includes(i.id));
    const unselected = items.filter(i => !selectedItemIds.includes(i.id));
    
    if (direction === 'up') {
      setItems([...unselected, ...selected]);
    } else {
      setItems([...selected, ...unselected]);
    }
  };

  // --- Selection Logic ---
  const handleItemMouseDown = (e: React.MouseEvent, item: DesignerItem) => {
    e.stopPropagation();
    
    // Check if we are clicking a resize handle (passed via class check or propagation stop in handle component)
    // Actually, we'll handle resize separately. This is for selection/dragging.

    let newSelectedIds = [...selectedItemIds];

    if (e.shiftKey) {
      // Toggle selection
      if (newSelectedIds.includes(item.id)) {
        newSelectedIds = newSelectedIds.filter(id => id !== item.id);
        // If item was in a group, deselect the whole group? Or just the item? 
        // For simplicity, let's just handle the item.
      } else {
        newSelectedIds.push(item.id);
        // If item is in a group, add all group members
        if (item.groupId) {
          const groupMembers = items.filter(i => i.groupId === item.groupId).map(i => i.id);
          groupMembers.forEach(id => {
            if (!newSelectedIds.includes(id)) newSelectedIds.push(id);
          });
        }
      }
    } else {
      // Single selection (or group selection)
      if (!newSelectedIds.includes(item.id)) {
        if (item.groupId) {
          newSelectedIds = items.filter(i => i.groupId === item.groupId).map(i => i.id);
        } else {
          newSelectedIds = [item.id];
        }
      }
    }

    setSelectedItemIds(newSelectedIds);
    
    // Only start dragging if item is not locked
    if (!item.locked) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      initialItemsStateRef.current = JSON.parse(JSON.stringify(items)); // Deep copy state for delta calc
    }
  };

  // --- Canvas Interaction ---
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    if (isDragging) {
      const dx = (e.clientX - dragStartRef.current.x) / canvasZoom;
      const dy = (e.clientY - dragStartRef.current.y) / canvasZoom;
      
      // Convert pixel delta to percentage
      const dxPercent = (dx / rect.width) * 100;
      const dyPercent = (dy / rect.height) * 100;

      setItems(prev => {
        return prev.map(item => {
          // Find initial state for this item
          const initialItem = initialItemsStateRef.current.find(i => i.id === item.id);
          if (initialItem && selectedItemIds.includes(item.id) && !item.locked) {
            return {
              ...item,
              x: initialItem.x + dxPercent,
              y: initialItem.y + dyPercent
            };
          }
          return item;
        });
      });
    }

    if (isResizing) {
       // Resize logic is handled by specific handle mouse events, but if we wanted a global drag for resize:
       // We rely on the ResizeHandle component's internal logic mostly or pass state up.
       // Here we implement a simple radial resize if resizing active
       const dx = (e.clientX - dragStartRef.current.x) / canvasZoom;
       // Simply scale based on drag distance for now
       // Better: Calculate distance from item center. 
       // For simplicity in this structure, we handle resize in the Handle component below.
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // --- Sub-Components ---
  
  // Resize Handle
  const ResizeHandle = ({ item, cursor, position }: { item: DesignerItem, cursor: string, position: string }) => {
    const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.locked) return;
      
      setIsResizing(true);
      
      const startX = e.clientX;
      const startScale = item.scale;

      const handleMove = (moveEvent: MouseEvent) => {
        const dx = (moveEvent.clientX - startX) / canvasZoom;
        // Sensitivity factor
        const scaleDelta = dx * 0.01; 
        const newScale = Math.max(0.1, Math.min(5, startScale + scaleDelta));
        
        // This updates the specific item directly in the main state
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, scale: newScale } : i));
      };

      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        setIsResizing(false);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    };

    const style: React.CSSProperties = {
      position: 'absolute',
      width: '12px',
      height: '12px',
      backgroundColor: '#6366f1', // Indigo-500
      borderRadius: '50%',
      cursor: cursor,
      zIndex: 20
    };

    if (position === 'tl') { style.top = '-6px'; style.left = '-6px'; }
    if (position === 'tr') { style.top = '-6px'; style.right = '-6px'; }
    if (position === 'bl') { style.bottom = '-6px'; style.left = '-6px'; }
    if (position === 'br') { style.bottom = '-6px'; style.right = '-6px'; }

    return <div style={style} onMouseDown={handleMouseDown} />;
  };

  const selectedItems = items.filter(i => selectedItemIds.includes(i.id));
  const isMultiSelect = selectedItems.length > 1;

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing) handleMouseUp();
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, isResizing]);

  const filteredTemplates = activeCategory === 'All' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === activeCategory);

  if (!background) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold font-serif text-slate-900">Virtual Room Planner</h2>
          <p className="text-slate-600">Design your dream space from scratch or use a template.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
              Upload Custom Background
            </h3>
            <ImageUpload onImageSelected={setBackground} />
            <p className="text-sm text-slate-500 text-center px-4">
              Take a photo of your empty room, or use an image from the web.
            </p>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <span className="bg-slate-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
               Choose a Template
            </h3>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                    ${activeCategory === cat 
                      ? 'bg-slate-800 text-white' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredTemplates.map((t, i) => (
                <button 
                  key={i}
                  onClick={() => setBackground(t.url)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left"
                >
                  <img src={t.url} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute bottom-2 left-3">
                    <span className="text-white font-bold text-sm block">{t.name}</span>
                    <span className="text-slate-200 text-[10px] uppercase tracking-wider">{t.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">Saved Designs</h3>
            <div className="flex gap-3">
                <input 
                  type="file" 
                  ref={importInputRef} 
                  className="hidden" 
                  accept=".json" 
                  onChange={handleImportDesigns}
                />
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
                  </svg>
                  Import
                </button>
                {savedDesigns.length > 0 && (
                  <button
                    onClick={handleExportDesigns}
                    className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                    </svg>
                    Export
                  </button>
                )}
            </div>
          </div>

          {savedDesigns.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {savedDesigns.map(design => (
                <div key={design.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
                  <div 
                    className="h-32 bg-slate-100 relative cursor-pointer" 
                    onClick={() => handleLoadDesign(design)}
                  >
                      <img src={design.background} className="w-full h-full object-cover opacity-50" alt="" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-slate-500 text-xs">{design.items.length} Items</span>
                      </div>
                  </div>
                  <div className="p-3 flex justify-between items-center bg-white">
                    <div onClick={() => handleLoadDesign(design)} className="cursor-pointer">
                      <p className="font-bold text-slate-900 text-sm truncate w-24">{design.name}</p>
                      <p className="text-xs text-slate-500">{design.date}</p>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteDesign(e, design.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 mb-2">No saved designs yet.</p>
                <p className="text-sm text-slate-400">Create a new design or import an existing file.</p>
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* Sidebar Controls */}
      <div className="w-full md:w-72 flex flex-col gap-4 h-full">
        
        {/* Properties Panel (Dynamic) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 overflow-y-auto max-h-[50%]">
           <h3 className="font-bold text-slate-900 mb-3 flex items-center justify-between">
             Properties
             {selectedItems.length > 0 && (
               <button onClick={handleDeleteSelected} className="text-red-500 text-xs hover:bg-red-50 px-2 py-1 rounded">Delete</button>
             )}
           </h3>
           
           {selectedItems.length > 0 ? (
             <div className="space-y-4">
               {isMultiSelect ? (
                  <div className="p-2 bg-indigo-50 rounded text-sm text-indigo-800 text-center font-medium">
                    {selectedItems.length} items selected
                  </div>
               ) : (
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-2xl">{selectedItems[0].icon}</span>
                     <span className="font-medium text-slate-700">{selectedItems[0].type}</span>
                  </div>
               )}

               {/* Lock Toggle */}
               <div className="flex items-center justify-between">
                 <span className="text-xs text-slate-500">Lock Position</span>
                 <button 
                   onClick={handleToggleLock}
                   className={`w-10 h-6 rounded-full p-1 transition-colors ${selectedItems.every(i => i.locked) ? 'bg-indigo-600' : 'bg-slate-300'}`}
                 >
                   <div className={`w-4 h-4 bg-white rounded-full transition-transform ${selectedItems.every(i => i.locked) ? 'translate-x-4' : ''}`} />
                 </button>
               </div>

               {/* Grouping */}
               {isMultiSelect && (
                 <button 
                   onClick={handleGroup}
                   className="w-full py-2 bg-slate-100 rounded-lg text-xs font-medium hover:bg-slate-200 text-slate-700"
                 >
                   Group Selected
                 </button>
               )}
               {selectedItems.some(i => i.groupId) && (
                 <button 
                   onClick={handleUngroup}
                   className="w-full py-2 bg-slate-100 rounded-lg text-xs font-medium hover:bg-slate-200 text-slate-700"
                 >
                   Ungroup Items
                 </button>
               )}

               {/* Common Controls (Scale/Rotate - applies to all selected) */}
               <div className="space-y-1">
                 <div className="flex justify-between text-xs text-slate-500">
                   <span>Scale</span>
                   {!isMultiSelect && <span>{Math.round(selectedItems[0].scale * 100)}%</span>}
                 </div>
                 <input 
                   type="range" 
                   min="0.2" 
                   max="3" 
                   step="0.1"
                   disabled={selectedItems.some(i => i.locked)}
                   value={!isMultiSelect ? selectedItems[0].scale : 1}
                   onChange={(e) => updateSelectedItems({ scale: parseFloat(e.target.value) })}
                   className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                 />
               </div>

               <div className="space-y-1">
                 <div className="flex justify-between text-xs text-slate-500">
                   <span>Rotation</span>
                   {!isMultiSelect && <span>{selectedItems[0].rotation}°</span>}
                 </div>
                 <input 
                   type="range" 
                   min="0" 
                   max="360" 
                   disabled={selectedItems.some(i => i.locked)}
                   value={!isMultiSelect ? selectedItems[0].rotation : 0}
                   onChange={(e) => updateSelectedItems({ rotation: parseInt(e.target.value) })}
                   className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                 />
               </div>

               <div className="flex gap-2">
                 <button 
                   onClick={() => handleLayer('down')}
                   className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-medium hover:bg-slate-200 text-slate-700"
                   title="Send Backward"
                 >
                   Send Back
                 </button>
                 <button 
                   onClick={() => handleLayer('up')}
                   className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-medium hover:bg-slate-200 text-slate-700"
                   title="Bring Forward"
                 >
                   Bring Front
                 </button>
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-40 text-slate-400">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-2 opacity-50">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
               </svg>
               <p className="text-sm italic">Select an item</p>
               <p className="text-xs mt-2">Shift+Click to select multiple</p>
             </div>
           )}
        </div>

        {/* Item Library */}
        <div className="flex-grow bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <h3 className="font-bold text-slate-900 mb-3">Add Items</h3>
          <div className="grid grid-cols-4 gap-2 overflow-y-auto pr-1">
            {FURNITURE_ITEMS.map((item) => (
              <button
                key={item.type}
                onClick={() => handleAddItem(item.icon, item.type)}
                className="aspect-square flex items-center justify-center text-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors"
                title={item.type}
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Global Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={handleSaveDesign}
            className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200"
          >
            Save Design
          </button>
          <button 
            onClick={() => setBackground(null)}
            className="px-4 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-grow flex flex-col gap-4 relative">
         {/* Zoom Controls */}
         <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white rounded-lg shadow-md border border-slate-200 p-1">
            <button 
              onClick={() => setCanvasZoom(z => Math.min(2, z + 0.1))}
              className="p-2 hover:bg-slate-100 rounded text-slate-600"
              title="Zoom In"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
            </button>
            <div className="text-xs text-center font-medium text-slate-500">{Math.round(canvasZoom * 100)}%</div>
            <button 
              onClick={() => setCanvasZoom(z => Math.max(0.5, z - 0.1))}
              className="p-2 hover:bg-slate-100 rounded text-slate-600"
              title="Zoom Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              onClick={() => setCanvasZoom(1)}
              className="p-2 hover:bg-slate-100 rounded text-slate-600 text-xs font-bold"
              title="Reset Zoom"
            >
              1:1
            </button>
         </div>

         <div className="flex-grow bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center select-none border border-slate-200 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">
          <div 
            ref={canvasRef}
            className="relative w-full h-full max-w-5xl max-h-full overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={() => setSelectedItemIds([])}
          >
            {/* Zoomable Container */}
            <div 
              className="w-full h-full transform-origin-center transition-transform duration-75"
              style={{ transform: `scale(${canvasZoom})` }}
            >
              {/* Background Layer */}
              <img 
                src={background} 
                alt="Room Background" 
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* Items Layer */}
              {items.map((item) => {
                const isSelected = selectedItemIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onMouseDown={(e) => handleItemMouseDown(e, item)}
                    className={`absolute origin-center transition-transform duration-75 group
                      ${isSelected ? 'z-50' : 'z-10'}
                      ${item.locked ? 'cursor-not-allowed opacity-90' : 'cursor-move'}
                    `}
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                      fontSize: `3rem`,
                    }}
                  >
                    <div className={`relative px-1 ${isSelected && !item.locked ? '' : ''}`}>
                      {item.icon}
                      
                      {/* Selection Box & Controls */}
                      {isSelected && (
                        <div className="absolute inset-0 border-2 border-dashed border-indigo-500 rounded-lg pointer-events-none">
                          {/* Locked Indicator */}
                          {item.locked && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                 <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
                               </svg>
                               Locked
                            </div>
                          )}
                          
                          {/* Resize Handles - Only if not locked and single selection for simplicity */}
                          {!item.locked && !isMultiSelect && (
                            <div className="pointer-events-auto">
                              <ResizeHandle item={item} cursor="nwse-resize" position="tl" />
                              <ResizeHandle item={item} cursor="nesw-resize" position="tr" />
                              <ResizeHandle item={item} cursor="nesw-resize" position="bl" />
                              <ResizeHandle item={item} cursor="nwse-resize" position="br" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State Overlay */}
            {items.length === 0 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 text-slate-800 px-6 py-2 rounded-full text-sm pointer-events-none backdrop-blur-md shadow-lg border border-slate-200 font-medium">
                Drag and drop furniture from the library
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
