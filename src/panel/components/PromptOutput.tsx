import React, { useState } from 'react';
import { Copy, Check, FileText, Code } from 'lucide-react';

interface PromptOutputProps {
  textPrompt: string;
  jsonPrompt: string;
  onCopyText: () => void;
  onCopyJson: () => void;
}

const PromptOutput: React.FC<PromptOutputProps> = ({
  textPrompt,
  jsonPrompt,
  onCopyText,
  onCopyJson,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'json'>('text');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const handleCopyText = () => {
    onCopyText();
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyJson = () => {
    onCopyJson();
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('text')}
            className={`
              px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors
              ${activeTab === 'text' 
                ? 'bg-accent/20 text-accent border border-accent/40 font-semibold' 
                : 'text-muted hover:text-text hover:bg-border/30'}
            `}
          >
            <FileText className="h-3 w-3" />
            <span>Markdown Prompt</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`
              px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors
              ${activeTab === 'json' 
                ? 'bg-accent/20 text-accent border border-accent/40 font-semibold' 
                : 'text-muted hover:text-text hover:bg-border/30'}
            `}
          >
            <Code className="h-3 w-3" />
            <span>JSON Prompt</span>
          </button>
        </div>

        <button
          onClick={activeTab === 'text' ? handleCopyText : handleCopyJson}
          className="text-xs text-accent hover:text-accent-contrast flex items-center gap-1 px-2 py-0.5 rounded hover:bg-accent/20 transition-all font-medium"
          title="Copy current prompt"
        >
          {(activeTab === 'text' ? copiedText : copiedJson) ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-2">
        {activeTab === 'text' ? (
          <textarea
            value={textPrompt}
            onClick={(e) => e.currentTarget.select()}
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg/80 text-text text-xs font-mono overflow-auto focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed select-all"
            rows={8}
            title="Click to select all"
          />
        ) : (
          <textarea
            value={jsonPrompt}
            onClick={(e) => e.currentTarget.select()}
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg/80 text-text text-xs font-mono overflow-auto focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed select-all"
            rows={8}
            title="Click to select all"
          />
        )}
      </div>
      <p className="text-[10px] text-muted mt-1.5 text-right">Click textarea to select all</p>
    </div>
  );
};

export default PromptOutput;