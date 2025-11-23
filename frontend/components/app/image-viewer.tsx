'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

interface ImageViewerProps {
    imageUrl: string | null;
    prompt: string | null;
    onClose: () => void;
}

export function ImageViewer({ imageUrl, prompt, onClose }: ImageViewerProps) {
    return (
        <AnimatePresence>
            {imageUrl && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative max-w-3xl w-full bg-card rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
                        >
                            <X size={20} weight="bold" />
                        </button>

                        <div className="relative aspect-square md:aspect-video w-full bg-black/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt={prompt || 'Generated Image'}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {prompt && (
                            <div className="p-4 bg-card border-t border-border">
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
                                    Generated from prompt
                                </p>
                                <p className="text-foreground font-medium">{prompt}</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
