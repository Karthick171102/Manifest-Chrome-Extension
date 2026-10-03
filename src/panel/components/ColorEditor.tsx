import React, { useState, useEffect, useRef } from 'react';
import { Palette, RotateCcw } from 'lucide-react';

interface ColorEditorProps {
  onColorChange: (color: string) => void;
  originalColor: string;
  currentColor: string;
}

const PRESET_COLORS = [
  '#86EE02', // Logo lime
  '#03301D', // Logo forest
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ffffff', // White
  '#94a3b8', // Slate
  '#0f172a', // Dark
];

function normalizeToHex(colorStr: string): string {
  if (!colorStr) return '#ffffff';
  if (colorStr.startsWith('#')) {
    if (colorStr.length === 4) {
      return `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}`;
    }
    return colorStr.slice(0, 7);
  }
  // Convert rgb/rgba to hex
  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#ffffff';
}

const ColorEditor: React.FC<ColorEditorProps> = ({
  onColorChange,
  originalColor,
  currentColor,
}) => {
  const [color, setColor] = useState(() => normalizeToHex(currentColor));
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setColor(normalizeToHex(currentColor));
  }, [currentColor]);

  const handleApplyColor = (newColor: string) => {
    setColor(newColor);
    setRecentColors(prev => {
      if (!prev.includes(newColor)) {
        return [newColor, ...prev].slice(0, 6);
      }
      return prev;
    });
    onColorChange(newColor);
  };

  const isModified = normalizeToHex(currentColor) !== normalizeToHex(originalColor);

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-text flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-accent" />
          <span>Text Color</span>
        </label>
        {isModified && (
          <button
            onClick={() => handleApplyColor(normalizeToHex(originalColor))}
            className="text-xs text-muted hover:text-accent flex items-center gap-1 transition-colors"
            title="Reset color to original"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        {/* Interactive color swatch that triggers color input */}
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          className="w-9 h-9 rounded-lg border-2 border-border/80 shadow-inner flex items-center justify-center cursor-pointer transition-transform hover:scale-105 relative overflow-hidden group"
          title="Click to pick a color"
          style={{ backgroundColor: color }}
        >
          <input
            ref={colorInputRef}
            type="color"
            value={color.startsWith('#') && color.length === 7 ? color : '#86EE02'}
            onChange={(e) => handleApplyColor(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer pointer-events-none"
          />
        </button>

        {/* Hex input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={color}
            onChange={(e) => {
              const val = e.target.value;
              setColor(val);
              if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
                handleApplyColor(val);
              }
            }}
            placeholder="#RRGGBB"
            maxLength={7}
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg/60 text-text font-mono text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all uppercase"
          />
        </div>
      </div>

      {/* Preset color swatches */}
      <div>
        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold block mb-1.5">Presets</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleApplyColor(c)}
              className={`w-6 h-6 rounded-md border transition-all ${
                color.toLowerCase() === c.toLowerCase()
                  ? 'border-accent ring-2 ring-accent/30 scale-110'
                  : 'border-border/60 hover:scale-110 hover:border-white/40'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Recent swatches if any */}
      {recentColors.length > 0 && (
        <div className="mt-2.5">
          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold block mb-1.5">Recent</span>
          <div className="flex flex-wrap gap-1.5">
            {recentColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleApplyColor(c)}
                className={`w-6 h-6 rounded-md border transition-all ${
                  color.toLowerCase() === c.toLowerCase()
                    ? 'border-accent ring-2 ring-accent/30 scale-110'
                    : 'border-border/60 hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorEditor;