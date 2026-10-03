import React, { useState, useEffect } from 'react';
import { Type, RotateCcw } from 'lucide-react';

interface TextEditorProps {
  onTextChange: (text: string) => void;
  originalText: string;
  currentText: string;
}

const TextEditor: React.FC<TextEditorProps> = ({
  onTextChange,
  originalText,
  currentText,
}) => {
  const [text, setText] = useState(currentText);

  useEffect(() => {
    setText(currentText);
  }, [currentText]);

  const isModified = text !== originalText;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-text flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5 text-accent" />
          <span>Text Content</span>
        </label>
        <div className="flex items-center gap-2">
          {isModified && (
            <button
              onClick={() => {
                setText(originalText);
                onTextChange(originalText);
              }}
              className="text-xs text-muted hover:text-accent flex items-center gap-1 transition-colors"
              title="Reset text to original"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
          <span className="text-[11px] text-muted font-mono">{text.length} chars</span>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          const newText = e.target.value;
          setText(newText);
          onTextChange(newText);
        }}
        rows={3}
        placeholder="Element text content..."
        className="w-full px-3 py-2 rounded-lg border border-border bg-bg/60 text-text placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-xs font-sans transition-all duration-200 resize-y"
        aria-label="Edit element text"
      />
    </div>
  );
};

export default TextEditor;