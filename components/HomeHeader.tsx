"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function HomeHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/75 dark:bg-zinc-900/75 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-85 transition-opacity">
          <GraduationCap className="h-6 w-6 text-zinc-900 dark:text-white" />
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white select-none">EduSuite</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-550 dark:text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Overview</Link>
          <Link href="/students" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Students</Link>
          <Link href="/courses" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Courses</Link>
        </nav>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <ThemeToggle />
          
          {/* Mobile hamburger menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 h-9 w-9"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Slide-down Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-zinc-200/40 dark:border-zinc-800/40 bg-white/95 dark:bg-zinc-900/95 absolute left-0 right-0 top-full px-6 py-4 shadow-lg flex flex-col gap-2 overflow-hidden backdrop-blur-md"
          >
            <Link 
              href="/dashboard" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-zinc-750 dark:text-zinc-350 hover:text-zinc-900 dark:hover:text-white py-2 border-b border-zinc-100 dark:border-zinc-850"
            >
              Overview
            </Link>
            <Link 
              href="/students" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-zinc-750 dark:text-zinc-350 hover:text-zinc-900 dark:hover:text-white py-2 border-b border-zinc-100 dark:border-zinc-850"
            >
              Students
            </Link>
            <Link 
              href="/courses" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-zinc-750 dark:text-zinc-350 hover:text-zinc-900 dark:hover:text-white py-2"
            >
              Courses
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
