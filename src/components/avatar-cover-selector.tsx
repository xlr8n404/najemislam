'use client';

import { motion, AnimatePresence } from 'framer-motion';

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
  const title = isCover ? 'Cover Photo' : 'Profile Photo';
  const deleteLabel = isCover ? 'Remove Cover Photo' : 'Remove Profile Photo';
  const addLabel = isCover ? 'Add Cover Photo' : 'Add Profile Photo';

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

              <div className="flex gap-3">
                {/* Remove Button - Left */}
                {hasImage && (
                  <button
                    onClick={() => {
                      onDelete();
                      onClose();
                    }}
                    className="flex-1 px-4 py-3 text-red-500 font-bold rounded-2xl border border-red-500/30 hover:bg-red-500/10 transition-colors text-center"
                  >
                    {deleteLabel}
                  </button>
                )}

                {/* Add Button - Right */}
                <button
                  onClick={() => {
                    onAddNew();
                    onClose();
                  }}
                  className={`${hasImage ? 'flex-1' : 'w-full'} px-4 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-center`}
                >
                  {addLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
