'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';

export default function HeroSection() {
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
  };

  return (
    <section className="relative w-full pt-24 pb-8 overflow-hidden flex flex-col items-center justify-center text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 relative">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          <motion.h1 
            variants={item}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[var(--color-text-primary)] mb-6"
          >
            Akses Premium <br className="hidden sm:block" />
            Tanpa Batas
          </motion.h1>
          
          <motion.p 
            variants={item}
            className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl leading-relaxed mb-10"
          >
            Cara tercepat dan terpercaya untuk mendapatkan akun digital favorit Anda dengan jaminan garansi.
          </motion.p>
          
          <motion.div variants={item} className="flex flex-col items-center gap-4">
            <button className="rounded-full bg-[var(--color-text-primary)] hover:bg-black text-white px-8 py-3.5 text-base font-medium transition-all shadow-sm active:scale-[0.98]">
              Lihat Katalog
            </button>
            <p className="text-sm text-[var(--color-text-muted)] font-medium mt-2">
              Dipercaya oleh 500+ pelanggan setiap bulannya.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
