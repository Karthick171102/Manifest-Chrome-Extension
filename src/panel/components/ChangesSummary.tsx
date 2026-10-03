import React from 'react';
import { History, Sparkles, Check, ArrowRight, FileText, Code2 } from 'lucide-react';
import { DiffChange } from '../../types';

interface ChangesSummaryProps {
  changes: DiffChange[];
  onCopy: (format: 'text' | 'json') => void;
}

const ChangesSummary: React.FC<ChangesSummaryProps> = ({
  changes,
  onCopy,
}) => {
  const hasChanges = changes.length > 0;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text text-xs uppercase tracking-wider flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-accent" />
          <span>Changes Summary ({changes.length})</span>
        </h3>
        {hasChanges && (
          <span className="text-[10px] bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-medium">
            Ready to prompt
          </span>
        )}
      </div>
      
      {hasChanges ? (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {changes.map((change, index) => {
            return (
              <div
                key={index}
                className="p-2.5 rounded-lg border border-border/60 bg-bg/50 text-xs flex flex-col gap-1 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-accent text-[11px] uppercase tracking-wider">
                    {change.property}
                  </span>
                  {change.property === 'color' && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border border-border/80 inline-block" style={{ backgroundColor: change.from }} />
                      <ArrowRight className="h-2.5 w-2.5 text-muted" />
                      <span className="w-3 h-3 rounded-full border border-border/80 inline-block" style={{ backgroundColor: change.to }} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-muted overflow-hidden">
                  <span className="line-through opacity-70 truncate max-w-[120px]" title={change.from}>
                    {change.from || '(empty)'}
                  </span>
                  <ArrowRight className="h-3 w-3 text-accent flex-shrink-0" />
                  <span className="text-text font-medium truncate" title={change.to}>
                    {change.to}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-border/60 rounded-lg bg-bg/30">
          <Sparkles className="h-5 w-5 mx-auto text-muted/60 mb-1.5" />
          <p className="text-xs text-muted">No changes yet. Edit text, color, or font above.</p>
        </div>
      )}
      
      {hasChanges && (
        <div className="mt-3 pt-3 border-t border-border flex gap-2">
          <button
            onClick={() => onCopy('text')}
            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border border-border hover:border-accent hover:text-accent bg-bg/60 transition-all flex items-center justify-center gap-1.5"
            title="Copy human-readable text prompt"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Copy Text</span>
          </button>
          <button
            onClick={() => onCopy('json')}
            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border border-border hover:border-accent hover:text-accent bg-bg/60 transition-all flex items-center justify-center gap-1.5"
            title="Copy structured JSON prompt for AI agents"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Copy JSON</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ChangesSummary;