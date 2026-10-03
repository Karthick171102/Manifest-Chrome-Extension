import React, { useState, useEffect } from 'react';
import { Type, RotateCcw } from 'lucide-react';

interface FontEditorProps {
  onFontChange: (fontFamily: string, fontSize: string, fontWeight: string, lineHeight: string) => void;
  originalFont: string;
  currentFont: string;
}

const POPULAR_GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Poppins',
  'Lato',
  'Montserrat',
  'Open Sans',
  'Oswald',
  'Merriweather',
  'Source Sans 3',
  'DM Sans',
  'Plus Jakarta Sans',
  'Outfit',
];

const FontEditor: React.FC<FontEditorProps> = ({
  onFontChange,
  originalFont,
  currentFont,
}) => {
  const [fontFamily, setFontFamily] = useState(currentFont || 'inherit');
  const [fontSize, setFontSize] = useState('');
  const [fontWeight, setFontWeight] = useState('');
  const [lineHeight, setLineHeight] = useState('');

  useEffect(() => {
    setFontFamily(currentFont || 'inherit');
  }, [currentFont]);

  const injectGoogleFont = (fontName: string) => {
    if (!fontName || fontName === 'inherit') return;
    const formattedName = fontName.replace(/\s+/g, '+');
    const existingLinks = document.querySelectorAll<HTMLLinkElement>('link[href*="googleapis.com"]');
    const alreadyLoaded = Array.from(existingLinks).some(link => 
      link.href && link.href.includes(formattedName)
    );
    
    if (!alreadyLoaded) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@300;400;500;600;700&display=swap`;
      document.head.appendChild(fontLink);
    }
  };

  const handleFontSelect = (font: string) => {
    setFontFamily(font);
    injectGoogleFont(font);
    onFontChange(font, fontSize, fontWeight, lineHeight);
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFontSize(val);
    onFontChange(fontFamily, val, fontWeight, lineHeight);
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFontWeight(val);
    onFontChange(fontFamily, fontSize, val, lineHeight);
  };

  const handleLineHeightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLineHeight(val);
    onFontChange(fontFamily, fontSize, fontWeight, val);
  };

  const handleReset = () => {
    setFontFamily(originalFont || 'inherit');
    setFontSize('');
    setFontWeight('');
    setLineHeight('');
    onFontChange(originalFont || 'inherit', '', '', '');
  };

  const isModified = fontFamily !== originalFont || Boolean(fontSize || fontWeight || lineHeight);

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-text flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5 text-accent" />
          <span>Typography</span>
        </label>
        {isModified && (
          <button
            onClick={handleReset}
            className="text-xs text-muted hover:text-accent flex items-center gap-1 transition-colors"
            title="Reset font to original"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Font family selector */}
      <div className="mb-3">
        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold block mb-1">Font Family</span>
        <select
          value={fontFamily}
          onChange={(e) => handleFontSelect(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg/60 text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
        >
          <option value="inherit">Inherit / Default</option>
          {POPULAR_GOOGLE_FONTS.map(font => (
            <option key={font} value={font}>
              {font} (Google Font)
            </option>
          ))}
        </select>

        {/* Quick font chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['Inter', 'Poppins', 'Roboto', 'Outfit'].map((font) => (
            <button
              key={font}
              type="button"
              onClick={() => handleFontSelect(font)}
              className={`px-2 py-1 rounded text-[11px] border transition-all ${
                fontFamily === font
                  ? 'border-accent bg-accent/15 text-accent font-medium'
                  : 'border-border/60 text-muted hover:text-text hover:border-border'
              }`}
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      {/* Typography Grid: Size, Weight, Line Height */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold block mb-1">Size</span>
          <select
            value={fontSize}
            onChange={handleSizeChange}
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg/60 text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent transition-all"
          >
            <option value="">Default</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="32px">32px</option>
          </select>
        </div>

        <div>
          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold block mb-1">Weight</span>
          <select
            value={fontWeight}
            onChange={handleWeightChange}
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg/60 text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent transition-all"
          >
            <option value="">Default</option>
            <option value="300">Light 300</option>
            <option value="400">Regular 400</option>
            <option value="500">Medium 500</option>
            <option value="600">Semibold 600</option>
            <option value="700">Bold 700</option>
          </select>
        </div>

        <div>
          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold block mb-1">Line Ht</span>
          <select
            value={lineHeight}
            onChange={handleLineHeightChange}
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg/60 text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent transition-all"
          >
            <option value="">Default</option>
            <option value="1.0">1.0</option>
            <option value="1.2">1.2</option>
            <option value="1.4">1.4</option>
            <option value="1.5">1.5</option>
            <option value="1.8">1.8</option>
            <option value="2.0">2.0</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FontEditor;