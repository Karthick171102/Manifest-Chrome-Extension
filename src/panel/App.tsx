import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMessagePassing } from './hooks/useMessagePassing';
import Header from './components/Header';
import ElementInfo from './components/ElementInfo';
import TextEditor from './components/TextEditor';
import ColorEditor from './components/ColorEditor';
import FontEditor from './components/FontEditor';
import ChangesSummary from './components/ChangesSummary';
import PromptOutput from './components/PromptOutput';
import Toast from './components/Toast';
import { EditedElement, DiffChange } from '../types';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [pointerActive, setPointerActive] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [prompt, setPrompt] = useState<{
    textPrompt: string;
    jsonPrompt: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { sendMessage, elementState } = useMessagePassing();

  // If an element was selected, turn off pointer mode
  useEffect(() => {
    if (elementState?.tagName) {
      setPointerActive(false);
    }
  }, [elementState?.tagName, elementState?.selector]);

  // Listen for pointer status or cancel events from content script
  useEffect(() => {
    const handleRuntimeMessage = (msg: any) => {
      if (msg?.type === 'pointer-status') {
        setPointerActive(Boolean(msg.active));
      } else if (msg?.type === 'element-selected') {
        setPointerActive(false);
        setToastMessage(`Selected <${msg.element?.tagName || 'element'}>`);
      } else if (msg?.type === 'url-changed') {
        setToastMessage('Page changed — inspector reset');
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleRuntimeMessage);
      return () => chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    }
  }, []);

  // Keyboard shortcut: Esc to cancel pointer mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pointerActive) {
        setPointerActive(false);
        sendMessage({ type: 'pointer-toggle', active: false });
        setToastMessage('Selection cancelled');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pointerActive, sendMessage]);

  // Toggle element selector
  const handleToggleSelectElement = useCallback(() => {
    const nextState = !pointerActive;
    setPointerActive(nextState);
    if (nextState) {
      setShowPrompt(false);
      setToastMessage('Click any element on the webpage to inspect');
    } else {
      setToastMessage('Selection cancelled');
    }
    sendMessage({ type: 'pointer-toggle', active: nextState });
  }, [pointerActive, sendMessage]);

  const handleTextChange = useCallback((text: string) => {
    sendMessage({ type: 'edit-text', text });
  }, [sendMessage]);

  const handleColorChange = useCallback((color: string) => {
    sendMessage({ type: 'edit-color', color });
  }, [sendMessage]);

  const handleFontChange = useCallback((fontFamily: string, fontSize: string, fontWeight: string, lineHeight: string) => {
    sendMessage({ type: 'edit-font', fontFamily, fontSize, fontWeight, lineHeight });
  }, [sendMessage]);

  // Compute changes diff
  const changes = useMemo(() => {
    return generateChanges(elementState);
  }, [elementState]);

  const handleGeneratePrompt = useCallback(() => {
    if (!elementState.tagName && !elementState.selector) {
      setToastMessage('Please select an element first');
      return;
    }

    const currentChanges = generateChanges(elementState);
    const textPrompt = generateTextPrompt(elementState, currentChanges);
    const jsonPrompt = generateJsonPrompt(elementState, currentChanges);

    setPrompt({ textPrompt, jsonPrompt });
    setShowPrompt(true);
    setToastMessage('Prompt generated successfully');
  }, [elementState]);

  const handleCopyPrompt = useCallback(async (format: 'text' | 'json') => {
    const currentChanges = generateChanges(elementState);
    const textToCopy = format === 'text' 
      ? (prompt?.textPrompt || generateTextPrompt(elementState, currentChanges))
      : (prompt?.jsonPrompt || generateJsonPrompt(elementState, currentChanges));

    try {
      await navigator.clipboard.writeText(textToCopy);
      setToastMessage(`Copied ${format.toUpperCase()} prompt to clipboard!`);
    } catch (err) {
      setToastMessage('Failed to copy to clipboard');
    }
  }, [elementState, prompt]);

  const handleReset = useCallback(() => {
    setPointerActive(false);
    setShowPrompt(false);
    setPrompt(null);
    sendMessage({ type: 'reset-selection' });
    setToastMessage('Reset all changes');
  }, [sendMessage]);

  const isElementSelected = Boolean(elementState?.tagName || elementState?.selector);

  return (
    <div className="flex flex-col h-screen bg-bg text-text max-w-full font-sans">
      <Header
        pointerActive={pointerActive}
        onToggle={handleToggleSelectElement}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-3 pb-6">
        <div className="divide-y divide-border">
          <ElementInfo
          element={elementState}
          onReset={handleReset}
        />

        {isElementSelected && (
          <>
            <div className="divide-y divide-border">
              <TextEditor
                onTextChange={handleTextChange}
                originalText={elementState.original.text}
                currentText={elementState.current.text}
              />
              <ColorEditor
                onColorChange={handleColorChange}
                originalColor={elementState.original.styles.color}
                currentColor={elementState.current.styles.color}
              />
              <FontEditor
                onFontChange={handleFontChange}
                originalFont={elementState.original.styles.fontFamily}
                currentFont={elementState.current.styles.fontFamily}
              />
            </div>

            <ChangesSummary
              changes={changes}
              onCopy={handleCopyPrompt}
            />

            {showPrompt && prompt && (
              <PromptOutput
                textPrompt={prompt.textPrompt}
                jsonPrompt={prompt.jsonPrompt}
                onCopyText={() => handleCopyPrompt('text')}
                onCopyJson={() => handleCopyPrompt('json')}
              />
            )}
          </>
        )}
        </div>
      </div>

      {/* Fixed footer: generate button stays visible while content scrolls */}
      {isElementSelected && (
        <div className="shrink-0 px-3 py-3 bg-bg border-t border-border">
          <button
            onClick={handleGeneratePrompt}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-accent to-accent2 hover:brightness-110 hover:shadow-accent/40 text-accent-contrast shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 border-0 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Agent / Ticket Prompt</span>
          </button>
        </div>
      )}

      <Toast message={toastMessage} />
    </div>
  );
};

function generateChanges(element: EditedElement): DiffChange[] {
  if (!element || (!element.tagName && !element.selector)) return [];
  const changes: DiffChange[] = [];

  if (element.current.text !== element.original.text) {
    changes.push({
      property: 'text',
      from: element.original.text,
      to: element.current.text,
    });
  }

  const styleProps: (keyof typeof element.original.styles)[] = ['color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight'];
  for (const prop of styleProps) {
    const origVal = element.original.styles[prop];
    const currVal = element.current.styles[prop];
    if (currVal && origVal !== currVal) {
      changes.push({
        property: prop,
        from: origVal || '(default)',
        to: currVal,
      });
    }
  }

  return changes;
}

function generateTextPrompt(element: EditedElement, changes: DiffChange[]): string {
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const changesList = changes.length > 0 
    ? changes.map(c => `  - ${c.property}: "${c.from}" → "${c.to}"`).join('\n')
    : '  - No visual modifications detected';

  const classStr = element.classes && element.classes.length > 0 ? `.${element.classes.join('.')}` : '';
  const idStr = element.id ? `#${element.id}` : '';

  return `### Webpage UI Change Request
**Target Element:** \`<${element.tagName || 'div'}${idStr}${classStr}>\`
**CSS Selector:** \`${element.selector || 'N/A'}\`

**Modifications:**
${changesList}

**Original Content:**
"${element.original.text.trim()}"

**Requested Content:**
"${element.current.text.trim()}"`;
}

function generateJsonPrompt(element: EditedElement, changes: DiffChange[]): string {
  const prompt = {
    action: "update_element",
    target: {
      tagName: element.tagName,
      id: element.id,
      classes: element.classes,
      selector: element.selector,
    },
    changes: changes.map(c => ({
      property: c.property,
      from: c.from,
      to: c.to,
    })),
    original: {
      text: element.original.text,
      styles: element.original.styles,
    },
    current: {
      text: element.current.text,
      styles: element.current.styles,
    }
  };

  return JSON.stringify(prompt, null, 2);
}

export default App;
