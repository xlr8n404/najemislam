'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus } from 'lucide-react';

interface AvatarCoverSelectorProps {
  type: 'avatar' | 'cover';
  isOpen: boolean;
  hasImage: boolean;
  onClose: () => void;
  onAddNew: () => void;
  onDelete: () => void;
}

export function AvatarCoverSelector({
  type,
  isOpen,
  hasImage,
  onClose,
  onAddNew,
  onDelete,
}: AvatarCoverSelectorProps) {
  const isCover = type === 'cover';
  const title = isCover ? 'Cover Photo' : 'Profile Picture';
  const deleteLabel = isCover ? 'Delete Cover Photo' : 'Delete Profile Picture';
  const addLabel = isCover ? 'Add New Cover Photo' : 'Add New Profile Picture';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-xl mx-auto rounded-t-[30px] bg-white dark:bg-black overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-4 mb-6" />

            <div className="px-4 pb-8">
              <h2 className="text-xl font-bold text-black dark:text-white mb-6">{title}</h2>

              <div className="space-y-3">
                {hasImage && (
                  <button
                    onClick={() => {
                      onDelete();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-left font-medium"
                  >
                    <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                    <span>{deleteLabel}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onAddNew();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl transition-colors text-left font-medium"
                >
                  <Plus className="w-5 h-5" strokeWidth={1.5} />
                  <span>{addLabel}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
