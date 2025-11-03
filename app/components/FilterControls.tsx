import React from 'react';
import type { DisplayMode, Filters } from '../App';

interface FilterControlsProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  hasSharedNodes: boolean;
  disabled: boolean;
  weightThreshold: number;
  setWeightThreshold: (value: number) => void;
}

const FilterCheckbox: React.FC<{
  id: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  colorClass: string;
  disabled?: boolean;
}> = ({ id, checked, onChange, label, colorClass, disabled = false }) => (
  <label htmlFor={id} className={`flex items-center space-x-2 cursor-pointer transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={`form-checkbox h-4 w-4 rounded-sm bg-gray-700 border-gray-600 focus:ring-2 focus:ring-offset-0 focus:ring-offset-gray-800 focus:ring-opacity-50 ${colorClass}`}
    />
    <span className="text-sm text-gray-300">{label}</span>
  </label>
);

const ViewModeButton: React.FC<{
  label: string;
  mode: DisplayMode;
  currentMode: DisplayMode;
  onClick: (mode: DisplayMode) => void;
  disabled?: boolean;
}> = ({ label, mode, currentMode, onClick, disabled = false }) => (
    <button
        onClick={() => onClick(mode)}
        disabled={disabled}
        className={`px-3 py-1.5 text-sm font-medium transition-colors duration-200 rounded-md ${
            currentMode === mode 
                ? 'bg-teal-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {label}
    </button>
);


export const FilterControls: React.FC<FilterControlsProps> = ({ 
    filters, setFilters, displayMode, setDisplayMode, hasSharedNodes, disabled, weightThreshold, setWeightThreshold
}) => {
  
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = event.target;
    setFilters((prev) => ({ ...prev, [id]: checked }));
  };
  
  return (
    <div className="my-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg relative">
        {disabled && (
            <div className="absolute inset-0 bg-gray-800/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
               <p className="text-gray-400 font-semibold">
                Generate a graph to enable filters
                </p>
            </div>
        )}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        
        <div className="flex items-center gap-x-2">
            <h4 className="text-sm font-bold text-gray-200 uppercase">View:</h4>
            <div className="flex items-center bg-gray-800 p-1 rounded-lg shadow-inner">
                <ViewModeButton label="Overlay" mode="overlay" currentMode={displayMode} onClick={setDisplayMode} disabled={disabled} />
                <ViewModeButton label="System A" mode="systemA" currentMode={displayMode} onClick={setDisplayMode} disabled={disabled} />
                <ViewModeButton label="System B" mode="systemB" currentMode={displayMode} onClick={setDisplayMode} disabled={disabled} />
                <ViewModeButton label="Intersection" mode="intersection" currentMode={displayMode} onClick={setDisplayMode} disabled={disabled || !hasSharedNodes} />
                <ViewModeButton label="Union" mode="union" currentMode={displayMode} onClick={setDisplayMode} disabled={disabled} />
            </div>
        </div>

        <div className="flex items-center gap-x-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase">Links</h4>
            <div className="flex items-center space-x-4">
                <FilterCheckbox id="showExplicit" checked={filters.showExplicit} onChange={handleFilterChange} label="Explicit" colorClass="text-lime-400 focus:ring-lime-400" disabled={disabled} />
                <FilterCheckbox id="showGenerated" checked={filters.showGenerated} onChange={handleFilterChange} label="Generated" colorClass="text-gray-400 focus:ring-gray-400" disabled={disabled} />
            </div>
        </div>
        
        <div className="flex items-center gap-x-2 flex-grow min-w-[200px]">
            <h4 className="text-sm font-bold text-gray-400 uppercase whitespace-nowrap">Min. Weight: <span className="font-bold text-teal-300">{weightThreshold}</span></h4>
            <input
                id="weight-filter"
                type="range"
                min="0"
                max="20"
                step="1"
                value={weightThreshold}
                onChange={(e) => setWeightThreshold(Number(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
        </div>

      </div>
    </div>
  );
};