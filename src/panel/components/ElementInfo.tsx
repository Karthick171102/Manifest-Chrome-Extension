import React from 'react';
import { Tag, Hash, Layers, RotateCcw, MousePointerClick } from 'lucide-react';
import { EditedElement } from '../../types';

interface ElementInfoProps {
  element: EditedElement;
  onReset: () => void;
}

const ElementInfo: React.FC<ElementInfoProps> = ({
  element,
  onReset,
}) => {
  const isSelected = Boolean(element.tagName || element.selector);

  if (!isSelected) {
    return (
      <div className="py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3 text-accent">
          <MousePointerClick className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-text text-sm mb-1">No Element Selected</h3>
        <p className="text-xs text-muted max-w-[280px] mx-auto">
          Click <strong className="text-accent">"Select Element"</strong> above, then hover and click any element on the webpage to inspect and edit it.
        </p>
      </div>
    );
  }

  const hasChanges = 
    element.current.text !== element.original.text ||
    element.current.styles.color !== element.original.styles.color ||
    element.current.styles.fontFamily !== element.original.styles.fontFamily ||
    element.current.styles.fontSize !== element.original.styles.fontSize ||
    element.current.styles.fontWeight !== element.original.styles.fontWeight ||
    element.current.styles.lineHeight !== element.original.styles.lineHeight;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text text-sm flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-accent" />
          <span>Selected Element</span>
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-muted hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-border/30"
          title="Reset selection and revert edits"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-bg/50 border border-border/40">
          <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold mb-0.5">Tag</span>
          <span className="font-mono text-accent font-medium uppercase">{element.tagName || '—'}</span>
        </div>
        <div className="p-2 rounded-lg bg-bg/50 border border-border/40">
          <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold mb-0.5">ID</span>
          <span className="font-mono text-text truncate block">{element.id ? `#${element.id}` : '—'}</span>
        </div>
        <div className="col-span-2 p-2 rounded-lg bg-bg/50 border border-border/40">
          <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold mb-0.5">Classes</span>
          <span className="font-mono text-text break-all text-[11px]">
            {element.classes && element.classes.length > 0 ? element.classes.map(c => `.${c}`).join(' ') : '—'}
          </span>
        </div>
        {element.selector && (
          <div className="col-span-2 p-2 rounded-lg bg-bg/50 border border-border/40">
            <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold mb-0.5">Selector</span>
            <span className="font-mono text-muted text-[11px] break-all">{element.selector}</span>
          </div>
        )}
      </div>

      {hasChanges && (
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-accent font-medium">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Unsaved changes active on page
          </span>
        </div>
      )}
    </div>
  );
};

export default ElementInfo;