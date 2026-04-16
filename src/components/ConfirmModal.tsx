import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onClose,
  variant = 'info'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#0a0b0e]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[100px] opacity-20 pointer-events-none ${
              variant === 'danger' ? 'bg-red-500' : 'bg-[#22ff88]'
            }`} />

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-[#22ff88]/10 text-[#22ff88]'
                }`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-[#64748b] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
              <p className="text-[#64748b] leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 h-12 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all text-sm uppercase tracking-widest"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 h-12 font-bold rounded-xl transition-all active:scale-95 text-sm uppercase tracking-widest ${
                    variant === 'danger' 
                      ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-red-600' 
                      : 'bg-[#22ff88] text-black shadow-[0_0_20px_rgba(34,255,136,0.2)] hover:opacity-90'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
