import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
      const timeout = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  if (!show || !message) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card/95 border border-accent/40 text-text rounded-xl px-4 py-2.5 text-xs font-medium shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-300 z-50 flex items-center gap-2 max-w-[90%]"
      style={{ opacity: show ? 1 : 0, transform: `translate(-50%, ${show ? '0' : '8px'})` }}
    >
      <div className="w-2 h-2 rounded-full bg-accent animate-ping flex-shrink-0" />
      <span className="truncate">{message}</span>
    </div>
  );
};

export default Toast;