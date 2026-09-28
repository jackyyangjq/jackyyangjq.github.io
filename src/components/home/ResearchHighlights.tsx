'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ResearchItem } from '@/types/page';
import { useMessages } from '@/lib/i18n/useMessages';
import { StatusBadge } from '@/components/pages/ResearchPage';

interface ResearchHighlightsProps {
    items: ResearchItem[];
    title?: string;
    href?: string;
}

export default function ResearchHighlights({ items, title, href = '/research' }: ResearchHighlightsProps) {
    const messages = useMessages();

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-serif font-bold text-primary">{title || messages.research.highlights}</h2>
                <Link
                    href={href}
                    className="text-accent hover:text-accent-dark text-sm font-medium transition-colors duration-200"
                >
                    {messages.home.viewAll} →
                </Link>
            </div>
            <div className="space-y-3">
                {items.map((item, index) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.08 * index }}
                        className="card-bg p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                        <StatusBadge status={item.status} venue={item.venue} />
                        <h3 className="mt-1.5 font-semibold text-primary leading-snug">{item.title}</h3>
                        {item.finding ? (
                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-500 leading-relaxed">{item.finding}</p>
                        ) : item.summary ? (
                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-500 leading-relaxed">{item.summary}</p>
                        ) : null}
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}
