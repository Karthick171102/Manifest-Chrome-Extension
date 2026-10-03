import { useState, useEffect, useCallback } from 'react';
import { EditedElement } from '../../types';

const INITIAL_ELEMENT_STATE: EditedElement = {
  selector: '',
  tagName: '',
  id: null,
  classes: [],
  original: {
    text: '',
    styles: {
      color: '',
      fontFamily: '',
      fontSize: '',
      fontWeight: '',
      lineHeight: '',
    },
  },
  current: {
    text: '',
    styles: {
      color: '',
      fontFamily: '',
      fontSize: '',
      fontWeight: '',
      lineHeight: '',
    },
  },
};

const STORAGE_KEY = 'visual-inspector-element';

export function useMessagePassing() {
  const [elementState, setElementState] = useState<EditedElement>(INITIAL_ELEMENT_STATE);

  // Load element state from storage when hook mounts
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (result && result[STORAGE_KEY]) {
          setElementState(result[STORAGE_KEY] as EditedElement);
        }
      });
    } else if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setElementState(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, []);

  // Listen for storage changes & runtime messages
  useEffect(() => {
    // Listen for window message in preview mode
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === 'element-selected' && event.data.element) {
        setElementState(event.data.element);
      } else if (event.data?.type === 'reset-ui') {
        setElementState(INITIAL_ELEMENT_STATE);
      }
    };
    window.addEventListener('message', handleWindowMessage);

    if (typeof chrome === 'undefined') {
      return () => window.removeEventListener('message', handleWindowMessage);
    }

    // Listen for storage changes from content script
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        const newVal = changes[STORAGE_KEY].newValue;
        if (newVal) {
          setElementState(newVal as EditedElement);
        } else {
          setElementState(INITIAL_ELEMENT_STATE);
        }
      }
    };

    // Listen for runtime messages
    const handleRuntimeMessage = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
      if (message?.type === 'element-selected' && message.element) {
        setElementState(message.element);
        sendResponse?.({ received: true });
      } else if (message?.type === 'reset-ui') {
        setElementState(INITIAL_ELEMENT_STATE);
        sendResponse?.({ received: true });
      }
      return true;
    };

    chrome.storage?.onChanged?.addListener(handleStorageChange);
    chrome.runtime?.onMessage?.addListener(handleRuntimeMessage);

    return () => {
      chrome.storage?.onChanged?.removeListener(handleStorageChange);
      chrome.runtime?.onMessage?.removeListener(handleRuntimeMessage);
    };
  }, []);

  // Send message to both active tab content script and runtime/background
  const sendMessage = useCallback(async (message: { type: string; [key: string]: any }) => {
    try {
      if (typeof chrome === 'undefined') return null;

      // 1. Send to active tab's content script directly
      if (chrome.tabs?.query) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs[0]?.id) {
          try {
            await chrome.tabs.sendMessage(tabs[0].id, message);
          } catch (tabErr) {
            // Tab might not have content script loaded (e.g. chrome:// URL)
            console.warn('Could not send message to tab:', tabErr);
          }
        }
      }

      // 2. Also send to runtime/background
      if (chrome.runtime?.sendMessage) {
        try {
          return await chrome.runtime.sendMessage(message);
        } catch (runtimeErr) {
          // No receiver in background is fine
        }
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
    return null;
  }, []);

  return { sendMessage, elementState, setElementState };
}