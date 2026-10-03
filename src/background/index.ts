// Background service worker for Manifest Chrome Extension

const DEV_RELOAD_FLAG = 'dev-reload.json';

// Enable opening side panel when user clicks the extension action icon
if (typeof chrome !== 'undefined' && chrome.sidePanel?.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.warn('Could not set side panel behavior:', error));
}

// Action click fallback
if (typeof chrome !== 'undefined' && chrome.action?.onClicked) {
  chrome.action.onClicked.addListener(async (tab) => {
    try {
      if (tab?.id && chrome.sidePanel?.open) {
        await chrome.sidePanel.open({ tabId: tab.id });
      }
    } catch (e) {
      console.warn('Could not open side panel on click:', e);
    }
  });
}

// Message types
interface InspectorMessage {
  type: string;
  [key: string]: any;
}

// Message routing
chrome.runtime.onMessage.addListener((message: InspectorMessage, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'element-selected':
          if (message.element) {
            await chrome.storage.local.set({ 'visual-inspector-element': message.element });
          }
          sendResponse({ success: true });
          break;

        case 'reset-selection':
          await chrome.storage.local.remove('visual-inspector-element');
          // Forward reset to active tab content script
          forwardToActiveTab({ type: 'reset-selection' });
          sendResponse({ success: true });
          break;

        case 'pointer-toggle':
        case 'edit-text':
        case 'edit-color':
        case 'edit-font':
          // Forward message to active tab
          forwardToActiveTab(message);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: true });
          break;
      }
    } catch (err) {
      console.error('Background message handling error:', err);
      sendResponse({ success: false, error: (err as Error).message });
    }
  })();
  return true; // Keep message channel open for async response
});

async function forwardToActiveTab(msg: any) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs[0]?.id) {
      await chrome.tabs.sendMessage(tabs[0].id, msg);
    }
  } catch (e) {
    // Content script might not be injected yet
  }
}

// Dev auto-reload: `npm run dev` writes dev-reload.json into dist/ and runs a
// WebSocket server; on rebuild it signals 'reload' and the extension reloads
// itself. Production builds never ship the flag file, so this stays inert.
(async () => {
  if (typeof chrome === 'undefined' || !chrome.runtime?.getURL || !chrome.runtime?.reload) return;
  try {
    const res = await fetch(chrome.runtime.getURL(DEV_RELOAD_FLAG));
    if (!res.ok) return;
    const flag = await res.json();
    if (!flag?.port) return;

    let socket: WebSocket | null = null;
    const connect = () => {
      socket = new WebSocket(`ws://127.0.0.1:${flag.port}`);
      socket.onmessage = (event) => {
        if (event.data === 'reload') chrome.runtime.reload();
      };
      socket.onclose = () => setTimeout(connect, 3000);
      socket.onerror = () => socket?.close();
    };
    connect();

    // WebSocket activity keeps the service worker alive so rebuilds are never missed
    setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) socket.send('ping');
    }, 20000);
  } catch {
    // Not a dev build (no dev-reload.json) — nothing to do
  }
})();