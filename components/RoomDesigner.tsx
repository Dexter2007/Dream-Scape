
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

const SHAPE_ITEMS = [
  { type: 'Square', icon: '■' },
  { type: 'Circle', icon: '●' },
  { type: 'Triangle', icon: '▲' },
];

const TEMPLATES = [
  // Living Rooms
  { name: 'Modern Living', category: 'Living', url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Boho Lounge', category: 'Living', url: 'https://images.unsplash.com/photo-1522444195799-478538b28823?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Minimalist Hall', category: 'Living', url: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  
  // Bedrooms
  { name: 'Cozy Bedroom', category: 'Bedroom', url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Master Suite', category: 'Bedroom', url: 'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Kids Room', category: 'Bedroom', url: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },

  // Kitchen & Dining
  { name: 'Modern Kitchen', category: 'Kitchen', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Dining Area', category: 'Kitchen', url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Rustic Kitchen', category: 'Kitchen', url: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },

  // Office
  { name: 'Home Office', category: 'Office', url: 'https://images.unsplash.com/photo-1593642532400-2682810df593?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Open Workspace', category: 'Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Creative Studio', category: 'Office', url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },

  // Empty / Unfurnished (Good for designing)
  { name: 'Empty Corner', category: 'Empty', url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'Empty Room', category: 'Empty', url: 'https://images.unsplash.com/photo-1493606278519-11aa9f86e40a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
  { name: 'White Walls', category: 'Empty', url: 'https://images.unsplash.com/photo-1558211583-03ed8a0b3d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' },
];

const CATEGORIES = ['All', 'Living', 'Bedroom', 'Kitchen', 'Office', 'Empty'];

// Move ResizeHandle outside to prevent remounting
const ResizeHandle = ({ 
  item, 
  cursor, 
  position, 
  canvasZoom, 
  setItems, 
  setIsResizing 
}: { 
  item: DesignerItem, 
  cursor: string, 
  position: string,
  canvasZoom: number,
  setItems: React.Dispatch<React.SetStateAction<DesignerItem[]>>,
  setIsResizing: (is: boolean) => void
}) => {
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (item.locked) return;
    
    setIsResizing(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startScale = item.scale;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      moveEvent.preventDefault(); // Prevent scrolling while resizing
      
      let currentX: number;
      if ('touches' in moveEvent) {
        if (moveEvent.touches.length === 0) return;
        currentX = moveEvent.touches[0].clientX;
      } else {
        currentX = (moveEvent as MouseEvent).clientX;
      }
      
      const dx = (currentX - startX) / canvasZoom;
      const scaleDelta = dx * 0.01; 
      const newScale = Math.max(0.1, Math.min(5, startScale + scaleDelta));
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, scale: newScale } : i));
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    // Use passive: false to allow preventDefault
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    width: '16px', // Larger touch target
    height: '16px',
    backgroundColor: '#6366f1',
    borderRadius: '50%',
    cursor: cursor,
    zIndex: 20,
    border: '2px solid white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  };

  if (position === 'tl') { style.top = '-8px'; style.left = '-8px'; }
  if (position === 'tr') { style.top = '-8px'; style.right = '-8px'; }
  if (position === 'bl') { style.bottom = '-8px'; style.left = '-8px'; }
  if (position === 'br') { style.bottom = '-8px'; style.right = '-8px'; }

  return <div style={style} onMouseDown={handleStart} onTouchStart={handleStart} />;
};

export const RoomDesigner: React.FC = () => {
  const [background, setBackground] = useState<string | null>(null);
  const [items, setItems] = useState<DesignerItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  // Mobile & Layout State
  const [activeTab, setActiveTab] = useState<'add' | 'properties' | 'settings' | null>('add');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(true);

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const initialItemsStateRef = useRef<DesignerItem[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Derived state MUST be defined before usage in handlers
  const selectedItems = items.filter(i => selectedItemIds.includes(i.id));
  const isMultiSelect = selectedItems.length > 1;

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

  // Update mobile tab when selection changes
  useEffect(() => {
    if (selectedItemIds.length > 0) {
      setActiveTab('properties');
      setIsMobileSheetOpen(true);
    }
  }, [selectedItemIds]);

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
        
        if (imported.length > 0 && (!imported[0].id || !imported[0].items)) {
           throw new Error("Invalid design format");
        }

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
    event.target.value = ''; 
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
      locked: false,
      color: SHAPE_ITEMS.some(s => s.type === type) ? '#5e5e5e' : undefined
    };
    
    setItems([...items, newItem]);
    setSelectedItemIds([newItem.id]);
    // On mobile, switch to properties view immediately after adding
    if (window.innerWidth < 768) {
      setActiveTab('properties');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItemIds.length > 0) {
      setItems(items.filter(i => !selectedItemIds.includes(i.id)));
      setSelectedItemIds([]);
      // Switch back to add tab if we deleted everything selected
      setActiveTab('add');
    }
  };

  const updateSelectedItems = (updates: Partial<DesignerItem>) => {
    setItems(items.map(i => selectedItemIds.includes(i.id) ? { ...i, ...updates } : i));
  };

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
    const selected = items.filter(i => selectedItemIds.includes(i.id));
    const unselected = items.filter(i => !selectedItemIds.includes(i.id));
    
    if (direction === 'up') {
      setItems([...unselected, ...selected]);
    } else {
      setItems([...selected, ...unselected]);
    }
  };

  const handleItemMouseDown = (e: React.MouseEvent | React.TouchEvent, item: DesignerItem) => {
    e.stopPropagation();
    
    let newSelectedIds = [...selectedItemIds];
    const isShiftKey = 'shiftKey' in e && e.shiftKey;

    if (isShiftKey) {
      if (newSelectedIds.includes(item.id)) {
        newSelectedIds = newSelectedIds.filter(id => id !== item.id);
      } else {
        newSelectedIds.push(item.id);
        if (item.groupId) {
          const groupMembers = items.filter(i => i.groupId === item.groupId).map(i => i.id);
          groupMembers.forEach(id => {
            if (!newSelectedIds.includes(id)) newSelectedIds.push(id);
          });
        }
      }
    } else {
      if (!newSelectedIds.includes(item.id)) {
        if (item.groupId) {
          newSelectedIds = items.filter(i => i.groupId === item.groupId).map(i => i.id);
        } else {
          newSelectedIds = [item.id];
        }
      }
    }

    setSelectedItemIds(newSelectedIds);
    
    if (!item.locked) {
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      dragStartRef.current = { x: clientX, y: clientY };
      initialItemsStateRef.current = JSON.parse(JSON.stringify(items)); 
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    if (isDragging) {
      const dx = (clientX - dragStartRef.current.x) / canvasZoom;
      const dy = (clientY - dragStartRef.current.y) / canvasZoom;
      
      const dxPercent = (dx / rect.width) * 100;
      const dyPercent = (dy / rect.height) * 100;

      setItems(prev => {
        return prev.map(item => {
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
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing) handleMouseUp();
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing]);

  const filteredTemplates = activeCategory === 'All' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === activeCategory);

  // --- Render Functions ---

  const renderPropertiesContent = () => (
    <div className="space-y-4">
      {selectedItems.length > 0 ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
             <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedItems[0].icon}</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {isMultiSelect ? `${selectedItems.length} Selected` : selectedItems[0].type}
                </span>
             </div>
             <button onClick={handleDeleteSelected} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
             </button>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={handleToggleLock}
              className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${selectedItems.every(i => i.locked) ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
              {selectedItems.every(i => i.locked) ? 'Unlock' : 'Lock'}
            </button>
            <button onClick={() => handleLayer('up')} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg flex flex-col items-center gap-1 text-xs text-slate-600 dark:text-slate-300 transition-colors">
               Forward
            </button>
            <button onClick={() => handleLayer('down')} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg flex flex-col items-center gap-1 text-xs text-slate-600 dark:text-slate-300 transition-colors">
               Back
            </button>
            {isMultiSelect ? (
               <button onClick={handleGroup} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg flex flex-col items-center gap-1 text-xs text-slate-600 dark:text-slate-300 transition-colors">Group</button>
            ) : selectedItems.some(i => i.groupId) ? (
               <button onClick={handleUngroup} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg flex flex-col items-center gap-1 text-xs text-slate-600 dark:text-slate-300 transition-colors">Ungroup</button>
            ) : <div/>}
          </div>

          {/* Sliders */}
          <div className="space-y-4 px-1">
             <div className="space-y-2">
               <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 font-medium">
                 <span>Scale</span>
                 <span>{!isMultiSelect && Math.round(selectedItems[0].scale * 100)}%</span>
               </div>
               <input 
                 type="range" 
                 min="0.2" max="5" step="0.1"
                 disabled={selectedItems.some(i => i.locked)}
                 value={!isMultiSelect ? selectedItems[0].scale : 1}
                 onChange={(e) => updateSelectedItems({ scale: parseFloat(e.target.value) })}
                 className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
               />
             </div>

             <div className="space-y-2">
               <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 font-medium">
                 <span>Rotation</span>
                 <span>{!isMultiSelect && selectedItems[0].rotation}°</span>
               </div>
               <input 
                 type="range" 
                 min="0" max="360"
                 disabled={selectedItems.some(i => i.locked)}
                 value={!isMultiSelect ? selectedItems[0].rotation : 0}
                 onChange={(e) => updateSelectedItems({ rotation: parseInt(e.target.value) })}
                 className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
               />
             </div>

             {/* Color Picker */}
             <div className="space-y-2">
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Tint / Color</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={(!isMultiSelect ? selectedItems[0].color : '#000000') || '#000000'}
                    onChange={(e) => updateSelectedItems({ color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <button onClick={() => updateSelectedItems({ color: undefined })} className="text-sm text-slate-400 dark:text-slate-500 underline hover:text-slate-600 dark:hover:text-slate-300">
                    Reset
                  </button>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
           <p>Select an item on the canvas to edit properties.</p>
        </div>
      )}
    </div>
  );

  const renderAddContent = () => (
    <div className="h-full overflow-hidden flex flex-col">
       <h3 className="font-bold text-slate-900 dark:text-white mb-3 px-1 hidden md:block">Library</h3>
       <div className="flex-grow overflow-y-auto pr-1 pb-20 md:pb-0 custom-scrollbar">
          <div className="mb-6">
             <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 sticky top-0 bg-white dark:bg-slate-800 py-2 z-10 transition-colors">Furniture</h4>
             <div className="grid grid-cols-4 gap-2 md:gap-3">
               {FURNITURE_ITEMS.map((item) => (
                 <button
                   key={item.type}
                   onClick={() => handleAddItem(item.icon, item.type)}
                   className="aspect-square flex items-center justify-center text-3xl bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-500/50 rounded-xl transition-all active:scale-95"
                 >
                   {item.icon}
                 </button>
               ))}
             </div>
          </div>

          <div>
             <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 sticky top-0 bg-white dark:bg-slate-800 py-2 z-10 transition-colors">Shapes</h4>
             <div className="grid grid-cols-4 gap-2 md:gap-3">
               {SHAPE_ITEMS.map((item) => (
                 <button
                   key={item.type}
                   onClick={() => handleAddItem(item.icon, item.type)}
                   className="aspect-square flex items-center justify-center text-3xl bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-500/50 rounded-xl transition-all active:scale-95 text-slate-700 dark:text-slate-200"
                 >
                   {item.icon}
                 </button>
               ))}
             </div>
          </div>
       </div>
    </div>
  );

  // --- Initial Setup View ---
  if (!background) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">Virtual Room Planner</h2>
          <p className="text-slate-600 dark:text-slate-300">Design your dream space from scratch or use a template.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-indigo-200/50 shadow-lg">1</span>
              Upload Background
            </h3>
            <ImageUpload onImageSelected={setBackground} />
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-4">
              Take a photo of your empty room, or use an image from the web.
            </p>
          </div>
          
          <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
               <span className="bg-slate-800 dark:bg-slate-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-slate-200/50 dark:shadow-none shadow-lg">2</span>
               Choose Template
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${activeCategory === cat 
                      ? 'bg-slate-800 dark:bg-slate-600 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
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
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-md transition-all text-left"
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

        <div className="border-t border-slate-200 dark:border-slate-700 pt-8 transition-colors">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Saved Designs</h3>
            <div className="flex gap-3 w-full sm:w-auto">
                <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportDesigns}/>
                <button onClick={() => importInputRef.current?.click()} className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                  Import
                </button>
                {savedDesigns.length > 0 && (
                  <button onClick={handleExportDesigns} className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2">
                    Export
                  </button>
                )}
            </div>
          </div>
          {savedDesigns.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {savedDesigns.map(design => (
                <div key={design.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group transition-colors">
                  <div className="h-32 bg-slate-100 dark:bg-slate-700 relative cursor-pointer" onClick={() => handleLoadDesign(design)}>
                      <img src={design.background} className="w-full h-full object-cover opacity-50" alt="" />
                      <div className="absolute inset-0 flex items-center justify-center"><span className="text-slate-500 dark:text-slate-400 text-xs">{design.items.length} Items</span></div>
                  </div>
                  <div className="p-3 flex justify-between items-center bg-white dark:bg-slate-800 transition-colors">
                    <div onClick={() => handleLoadDesign(design)} className="cursor-pointer overflow-hidden">
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{design.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{design.date}</p>
                    </div>
                    <button onClick={(e) => handleDeleteDesign(e, design.id)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1">
                       <span className="sr-only">Delete</span>
                       ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors"><p className="text-slate-500 dark:text-slate-400 text-sm">No saved designs yet.</p></div>
          )}
        </div>
      </div>
    );
  }

  // --- Main Designer View ---
  // Use h-[100dvh] (dynamic viewport height) for mobile to prevent address bar jumps
  return (
    <div className="relative h-[100dvh] md:h-[calc(100vh-140px)] min-h-[500px] flex flex-col md:flex-row gap-6 animate-fade-in-up overflow-hidden md:overflow-visible -mt-4 md:mt-0">
      
      {/* Desktop Sidebar (Left) */}
      <div className="hidden md:flex w-72 flex-col gap-4 h-full">
        {/* Properties Panel */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 overflow-y-auto max-h-[45%]">
           <h3 className="font-bold text-slate-900 dark:text-white mb-3">Properties</h3>
           {renderPropertiesContent()}
        </div>

        {/* Library Panel */}
        <div className="flex-grow bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col transition-colors">
          {renderAddContent()}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleSaveDesign} className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md">Save</button>
          <button onClick={() => setBackground(null)} className="px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Exit</button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="absolute inset-0 md:relative md:inset-auto md:flex-grow flex flex-col z-0">
         {/* Top Mobile Controls */}
         <div className="md:hidden absolute top-4 left-4 right-4 z-30 flex justify-between">
            <button onClick={() => setBackground(null)} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur text-slate-700 dark:text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm border border-slate-200 dark:border-slate-700">
               Exit
            </button>
            <button onClick={handleSaveDesign} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
               Save
            </button>
         </div>

         {/* Zoom Controls */}
         <div className="absolute top-16 right-4 md:top-4 md:right-4 z-20 flex flex-col gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-1 transition-colors">
            <button onClick={() => setCanvasZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
              <span className="text-xl leading-none">+</span>
            </button>
            <div className="text-xs text-center font-medium text-slate-500 dark:text-slate-400 select-none">{Math.round(canvasZoom * 100)}%</div>
            <button onClick={() => setCanvasZoom(z => Math.max(0.5, z - 0.1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
              <span className="text-xl leading-none">-</span>
            </button>
         </div>

         {/* Canvas */}
         <div className="flex-grow bg-slate-100 dark:bg-slate-900 md:rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center select-none border border-slate-200 dark:border-slate-700 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] transition-colors">
          <div 
            ref={canvasRef}
            className="relative w-full h-full max-w-5xl max-h-full overflow-hidden touch-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onClick={() => setSelectedItemIds([])}
          >
            <div 
              className="w-full h-full transform-origin-center transition-transform duration-75"
              style={{ transform: `scale(${canvasZoom})` }}
            >
              <img src={background} alt="Room" className="w-full h-full object-contain pointer-events-none" />
              {items.map((item) => {
                const isSelected = selectedItemIds.includes(item.id);
                const isShape = SHAPE_ITEMS.some(s => s.type === item.type);
                return (
                  <div
                    key={item.id}
                    onMouseDown={(e) => handleItemMouseDown(e, item)}
                    onTouchStart={(e) => handleItemMouseDown(e, item)}
                    className={`absolute origin-center transition-transform duration-75 ${isSelected ? 'z-50' : 'z-10'} ${item.locked ? 'opacity-90' : ''}`}
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                      fontSize: `3rem`,
                      color: item.color,
                      filter: item.color && !isShape ? `drop-shadow(0 0 8px ${item.color})` : 'none',
                      textShadow: item.color && isShape ? `0 0 2px ${item.color}` : 'none'
                    }}
                  >
                    <div className="relative px-1">
                      {item.icon}
                      {isSelected && (
                        <div className="absolute inset-0 border-2 border-dashed border-indigo-500 rounded-lg pointer-events-none">
                          {!item.locked && !isMultiSelect && (
                            <div className="pointer-events-auto">
                              <ResizeHandle 
                                item={item} 
                                cursor="nwse-resize" 
                                position="tl" 
                                canvasZoom={canvasZoom} 
                                setItems={setItems} 
                                setIsResizing={setIsResizing} 
                              />
                              <ResizeHandle 
                                item={item} 
                                cursor="nesw-resize" 
                                position="tr" 
                                canvasZoom={canvasZoom} 
                                setItems={setItems} 
                                setIsResizing={setIsResizing} 
                              />
                              <ResizeHandle 
                                item={item} 
                                cursor="nesw-resize" 
                                position="bl" 
                                canvasZoom={canvasZoom} 
                                setItems={setItems} 
                                setIsResizing={setIsResizing} 
                              />
                              <ResizeHandle 
                                item={item} 
                                cursor="nwse-resize" 
                                position="br" 
                                canvasZoom={canvasZoom} 
                                setItems={setItems} 
                                setIsResizing={setIsResizing} 
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {items.length === 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 px-6 py-2 rounded-full text-sm pointer-events-none backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700 font-medium whitespace-nowrap transition-colors">
                Tap "+" to add furniture
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet & Tabs */}
      <div className="md:hidden">
        {/* Tab Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around items-center h-16 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] transition-colors">
           <button 
             onClick={() => { setActiveTab('add'); setIsMobileSheetOpen(true); }}
             className={`flex flex-col items-center gap-1 ${activeTab === 'add' && isMobileSheetOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
           >
              <div className="text-2xl font-light leading-none">+</div>
              <span className="text-[10px] font-medium">Add</span>
           </button>
           <button 
             onClick={() => { if(selectedItems.length > 0) { setActiveTab('properties'); setIsMobileSheetOpen(true); } }}
             className={`flex flex-col items-center gap-1 ${activeTab === 'properties' && isMobileSheetOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} ${selectedItems.length === 0 ? 'opacity-50' : ''}`}
             disabled={selectedItems.length === 0}
           >
              <div className="text-lg leading-none mt-1">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
              </div>
              <span className="text-[10px] font-medium">Edit</span>
           </button>
           <button 
             onClick={() => setIsMobileSheetOpen(!isMobileSheetOpen)}
             className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400"
           >
              <div className="text-lg leading-none mt-1">
                {isMobileSheetOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01.02 1.06z" clipRule="evenodd" /></svg>
                )}
              </div>
              <span className="text-[10px] font-medium">{isMobileSheetOpen ? 'Hide' : 'Show'}</span>
           </button>
        </div>

        {/* Sliding Sheet Container */}
        <div 
           className={`fixed bottom-16 left-0 right-0 bg-white dark:bg-slate-800 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] rounded-t-2xl z-40 transition-transform duration-300 ease-in-out border-t border-slate-100 dark:border-slate-700
             ${isMobileSheetOpen ? 'translate-y-0' : 'translate-y-[110%]'}
           `}
           style={{ height: '50vh', maxHeight: '400px' }}
        >
           {/* Handle */}
           <div className="w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={() => setIsMobileSheetOpen(false)}>
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
           </div>

           <div className="h-full overflow-hidden p-4 pb-12">
              {activeTab === 'add' && renderAddContent()}
              {activeTab === 'properties' && renderPropertiesContent()}
           </div>
        </div>
      </div>
    </div>
  );
};
