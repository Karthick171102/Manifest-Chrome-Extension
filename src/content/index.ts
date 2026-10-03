import { EditedElement, ElementStyles, DiffChange } from '../types';

// State management
let isPointerActive = false;
let currentSelectedElement: HTMLElement | null = null;
let originalElementData: EditedElement | null = null;
let hoverOverlay: HTMLElement | null = null;
let persistentOverlay: HTMLElement | null = null;
let tooltipElement: HTMLElement | null = null;
let bannerElement: HTMLElement | null = null;

const STORAGE_KEY = 'visual-inspector-element';

// Generate a clean, reliable CSS selector for an element
function generateSelector(el: HTMLElement): string {
  if (el.id) {
    return `#${CSS.escape(el.id)}`;
  }

  const path: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${CSS.escape(current.id)}`;
      path.unshift(selector);
      break;
    }

    const validClasses = Array.from(current.classList).filter(
      c => !c.startsWith('visual-inspector-') && !c.includes(':') && !c.includes('/')
    );
    if (validClasses.length > 0) {
      selector += `.${validClasses.map(c => CSS.escape(c)).join('.')}`;
    }

    // Add nth-of-type if siblings share same tag
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === current?.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

// Extract original state from an element
function extractElementData(element: HTMLElement): EditedElement {
  const computed = window.getComputedStyle(element);
  const selector = generateSelector(element);
  const classes = Array.from(element.classList).filter(c => !c.startsWith('visual-inspector-'));

  const styles: ElementStyles = {
    color: computed.color,
    fontFamily: computed.fontFamily,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    lineHeight: computed.lineHeight,
  };

  const textContent = (element.innerText || element.textContent || '').trim();

  return {
    selector,
    tagName: element.tagName.toLowerCase(),
    id: element.id || null,
    classes,
    original: {
      text: textContent,
      styles: { ...styles },
    },
    current: {
      text: textContent,
      styles: { ...styles },
    },
  };
}

// Create or update hover highlight
function updateHoverOverlay(target: HTMLElement) {
  // Remove existing overlay first
  if (hoverOverlay) {
    hoverOverlay.remove();
    hoverOverlay = null;
  }
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }

  // Create new overlay
  hoverOverlay = document.createElement('div');
  hoverOverlay.className = 'visual-inspector-highlight';
  hoverOverlay.style.cssText = `
    position: fixed;
    left: ${target.getBoundingClientRect().left}px;
    top: ${target.getBoundingClientRect().top}px;
    width: ${target.getBoundingClientRect().width}px;
    height: ${target.getBoundingClientRect().height}px;
    pointer-events: none;
    z-index: 2147483640;
    border: 2px solid rgb(var(--mvi-accent));
    background-color: rgb(var(--mvi-accent) / 0.15);
    border-radius: 4px;
    box-shadow: 0 0 12px rgb(var(--mvi-accent) / 0.4);
    transition: all 0.08s ease-out;
    display: block;
  `;

  document.body.appendChild(hoverOverlay);

  // Create tooltip
  tooltipElement = document.createElement('div');
  tooltipElement.className = 'visual-inspector-tooltip';
  tooltipElement.style.cssText = `
    position: fixed;
    background: rgb(var(--mvi-bg) / 0.97);
    color: rgb(var(--mvi-accent));
    border: 1px solid rgb(var(--mvi-accent) / 0.4);
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-family: monospace;
    font-weight: 600;
    pointer-events: none;
    z-index: 2147483645;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    display: block;
  `;

  const idText = target.id ? `#${target.id}` : '';
  const validClasses = Array.from(target.classList).filter(c => !c.startsWith('visual-inspector-'));
  const classText = validClasses.length > 0 ? `.${validClasses.slice(0, 2).join('.')}` : '';

  tooltipElement.textContent = `<${target.tagName.toLowerCase()}${idText}${classText}>`;
  tooltipElement.style.position = 'fixed';
  tooltipElement.style.left = `${Math.max(8, target.getBoundingClientRect().left)}px`;
  tooltipElement.style.top = `${Math.max(8, target.getBoundingClientRect().top - 28)}px`;

  document.body.appendChild(tooltipElement);
}

function removeHoverOverlay() {
  if (hoverOverlay) {
    hoverOverlay.remove();
    hoverOverlay = null;
  }
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }
}

// Persistent highlight for selected element
function setPersistentHighlight(target: HTMLElement) {
  if (!persistentOverlay) {
    persistentOverlay = document.createElement('div');
    persistentOverlay.className = 'visual-inspector-persistent-highlight';
    document.body.appendChild(persistentOverlay);
  }

  const rect = target.getBoundingClientRect();
  persistentOverlay.style.cssText = `
    position: fixed;
    left: ${rect.left - 2}px;
    top: ${rect.top - 2}px;
    width: ${rect.width + 4}px;
    height: ${rect.height + 4}px;
    pointer-events: none;
    z-index: 2147483639;
    border: 2px dashed rgb(var(--mvi-accent));
    background-color: rgb(var(--mvi-accent) / 0.08);
    border-radius: 6px;
    box-shadow: 0 0 16px rgb(var(--mvi-accent) / 0.35);
    display: block;
  `;
}

function removePersistentHighlight() {
  if (persistentOverlay) {
    persistentOverlay.remove();
    persistentOverlay = null;
  }
}

// Banner when pointer mode is active
function showActiveBanner() {
  if (!bannerElement) {
    bannerElement = document.createElement('div');
    bannerElement.className = 'visual-inspector-banner';
    bannerElement.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:rgb(var(--mvi-accent)); animation:pulse 1.5s infinite;"></span>
        <span><strong>Manifest:</strong> Click any element to inspect & edit</span>
        <span style="opacity:0.6; font-size:11px; margin-left:8px;">(Press Esc to cancel)</span>
      </div>
    `;
    bannerElement.style.cssText = `
      position: fixed;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgb(var(--mvi-bg) / 0.95);
      color: rgb(var(--mvi-text));
      padding: 8px 16px;
      border-radius: 30px;
      font-size: 12px;
      font-family: Manrope, system-ui, sans-serif;
      border: 1px solid rgb(var(--mvi-accent) / 0.5);
      box-shadow: 0 6px 20px rgba(0,0,0,0.6);
      z-index: 2147483647;
      pointer-events: none;
      backdrop-filter: blur(8px);
    `;
    document.body.appendChild(bannerElement);
  }
}

function removeActiveBanner() {
  if (bannerElement) {
    bannerElement.remove();
    bannerElement = null;
  }
}

// Turn pointer mode on or off
function setPointerMode(active: boolean) {
  isPointerActive = active;
  if (active) {
    document.body.style.cursor = 'crosshair';
    showActiveBanner();
  } else {
    document.body.style.cursor = '';
    removeHoverOverlay();
    removeActiveBanner();
  }
}

// Revert applied edits on the selected element
function revertEdits() {
  if (currentSelectedElement && originalElementData) {
    currentSelectedElement.textContent = originalElementData.original.text;
    currentSelectedElement.style.color = originalElementData.original.styles.color || '';
    currentSelectedElement.style.fontFamily = originalElementData.original.styles.fontFamily || '';
    currentSelectedElement.style.fontSize = originalElementData.original.styles.fontSize || '';
    currentSelectedElement.style.fontWeight = originalElementData.original.styles.fontWeight || '';
    currentSelectedElement.style.lineHeight = originalElementData.original.styles.lineHeight || '';
  }
}

// Full session reset: revert edits, clear selection/overlays/pointer mode/storage
function clearSession() {
  revertEdits();
  currentSelectedElement = null;
  originalElementData = null;
  removePersistentHighlight();
  removeHoverOverlay();
  setPointerMode(false);
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.remove(STORAGE_KEY);
  }
}

// Reposition persistent overlay on scroll/resize
function handleScrollOrResize() {
  if (currentSelectedElement && persistentOverlay) {
    const rect = currentSelectedElement.getBoundingClientRect();
    persistentOverlay.style.left = `${rect.left - 2}px`;
    persistentOverlay.style.top = `${rect.top - 2}px`;
    persistentOverlay.style.width = `${rect.width + 4}px`;
    persistentOverlay.style.height = `${rect.height + 4}px`;
  }
}
window.addEventListener('scroll', handleScrollOrResize, { passive: true });
window.addEventListener('resize', handleScrollOrResize, { passive: true });

// Mousemove listener for hover overlay
document.addEventListener('mousemove', (e: MouseEvent) => {
  if (!isPointerActive) return;

  const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
  if (!target) return;

  // Skip if target is body or document element
  if (target.tagName.toLowerCase() === 'body' || target.tagName.toLowerCase() === 'html') return;

  // Skip if inside visual-inspector elements
  if (target.closest('[class*="visual-inspector-"]')) return;

  updateHoverOverlay(target);
}, { passive: true });

// Click listener for element selection
document.addEventListener('click', (e: MouseEvent) => {
  if (!isPointerActive) return;

  const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
  if (!target) return;

  // Skip if target is body or document element
  if (target.tagName.toLowerCase() === 'body' || target.tagName.toLowerCase() === 'html') return;

  // Skip if inside visual-inspector elements
  if (target.closest('[class*="visual-inspector-"]')) return;

  e.preventDefault();
  e.stopPropagation();

  // Deactivate pointer mode
  setPointerMode(false);

  // Set selected element
  currentSelectedElement = target;
  setPersistentHighlight(target);

  // Extract element data
  const data = extractElementData(target);
  originalElementData = JSON.parse(JSON.stringify(data));

  // Store in chrome.storage.local
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ [STORAGE_KEY]: data });
  }

  // Notify side panel
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: 'element-selected', element: data });
    chrome.runtime.sendMessage({ type: 'pointer-status', active: false });
  }
}, true); // Use capture phase to intercept before page listeners

// Escape key to cancel pointer mode
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isPointerActive) {
    setPointerMode(false);
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'pointer-status', active: false });
    }
  }
});

// Dynamic Google Font Injection
function injectGoogleFont(fontFamily: string) {
  if (!fontFamily || fontFamily === 'inherit') return;
  const formatted = fontFamily.replace(/\s+/g, '+');
  const existing = document.querySelector(`link[href*="${formatted}"]`);
  if (!existing) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${formatted}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }
}

// Runtime message receiver from Side Panel & Background
chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  switch (message?.type) {
    case 'pointer-toggle':
      setPointerMode(Boolean(message.active));
      sendResponse?.({ success: true, active: isPointerActive });
      break;

    case 'edit-text':
      if (currentSelectedElement && typeof message.text === 'string') {
        currentSelectedElement.textContent = message.text;
        if (originalElementData) {
          originalElementData.current.text = message.text;
          chrome.storage.local.set({ [STORAGE_KEY]: originalElementData });
        }
      }
      sendResponse?.({ success: true });
      break;

    case 'edit-color':
      if (currentSelectedElement && message.color) {
        currentSelectedElement.style.color = message.color;
        if (originalElementData) {
          originalElementData.current.styles.color = message.color;
          chrome.storage.local.set({ [STORAGE_KEY]: originalElementData });
        }
      }
      sendResponse?.({ success: true });
      break;

    case 'edit-font':
      if (currentSelectedElement) {
        if (message.fontFamily && message.fontFamily !== 'inherit') {
          injectGoogleFont(message.fontFamily);
          currentSelectedElement.style.fontFamily = message.fontFamily;
          if (originalElementData) originalElementData.current.styles.fontFamily = message.fontFamily;
        }
        if (message.fontSize) {
          currentSelectedElement.style.fontSize = message.fontSize;
          if (originalElementData) originalElementData.current.styles.fontSize = message.fontSize;
        }
        if (message.fontWeight) {
          currentSelectedElement.style.fontWeight = message.fontWeight;
          if (originalElementData) originalElementData.current.styles.fontWeight = message.fontWeight;
        }
        if (message.lineHeight) {
          currentSelectedElement.style.lineHeight = message.lineHeight;
          if (originalElementData) originalElementData.current.styles.lineHeight = message.lineHeight;
        }
        if (originalElementData) {
          chrome.storage.local.set({ [STORAGE_KEY]: originalElementData });
        }
      }
      sendResponse?.({ success: true });
      break;

    case 'reset-selection':
      clearSession();
      sendResponse?.({ success: true });
      break;

    default:
      sendResponse?.({ success: true });
      break;
  }
  return true;
});

// ---- Auto-reset when the page URL changes (SPA + classic navigation) ----

// A fresh page load invalidates any previously selected element held in storage
if (typeof chrome !== 'undefined' && chrome.storage?.local) {
  chrome.storage.local.remove(STORAGE_KEY);
}

let lastUrl = window.location.href;

function handleUrlChange() {
  if (window.location.href === lastUrl) return;
  lastUrl = window.location.href;

  const hadSession = isPointerActive || Boolean(currentSelectedElement) || Boolean(originalElementData);
  clearSession();

  if (hadSession && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    // Panel listens for both: clears pointer state and shows a reset notice
    chrome.runtime.sendMessage({ type: 'pointer-status', active: false });
    chrome.runtime.sendMessage({ type: 'url-changed' });
  }
}

// SPA frameworks use the History API without firing popstate; history-hook.js
// (MAIN world) patches the page's history and re-broadcasts navigations as
// 'manifest:url-change', since the isolated world can't wrap page history.
window.addEventListener('manifest:url-change', handleUrlChange);
window.addEventListener('popstate', handleUrlChange);
window.addEventListener('hashchange', handleUrlChange);
// Fallback poll for navigation paths that bypass History API events
window.setInterval(handleUrlChange, 1000);