"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional class for the panel (e.g. max width, background) */
  panelClassName?: string;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  panelClassName = "w-full max-w-md",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
          aria-hidden
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative rounded-2xl shadow-2xl ${panelClassName}`}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
