'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { TextPageConfig } from '@/types/page';

interface TextPageProps {
    config: TextPageConfig;
    content: string;
    embedded?: boolean;
}

export default function TextPage({ config, content, embedded = false }: TextPageProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={embedded ? "" : "max-w-3xl mx-auto"}
        >
            <h1 className={`${embedded ? "text-2xl" : "text-4xl"} font-serif font-bold text-primary mb-4`}>{config.title}</h1>
            {config.description && (
                <p className={`${embedded ? "text-base" : "text-lg"} text-neutral-600 dark:text-neutral-500 mb-6 max-w-2xl`}>
                    {config.description}
                </p>
            )}
            {config.downloads && config.downloads.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-10">
                    {config.downloads.map((item, index) => (
                        <a
                            key={item.href}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-umami-event="cv-download"
                            data-umami-event-version={item.label}
                            className={
                                index === 0
                                    ? 'inline-flex flex-col px-5 py-3 rounded-lg bg-accent text-white dark:text-neutral-50 hover:bg-accent-dark transition-colors shadow-sm'
                                    : 'inline-flex flex-col px-5 py-3 rounded-lg border border-accent/40 text-accent hover:bg-accent/10 transition-colors'
                            }
                        >
                            <span className="inline-flex items-center gap-2 text-sm font-semibold">
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                {item.label}
                            </span>
                            {item.note && <span className="text-xs opacity-80 mt-0.5">{item.note}</span>}
                        </a>
                    ))}
                </div>
            )}
            <div className="text-neutral-700 dark:text-neutral-600 leading-relaxed">
                <ReactMarkdown
                    components={{
                        h1: ({ children }) => <h1 className="text-3xl font-serif font-bold text-primary mt-8 mb-4">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-2xl font-serif font-bold text-primary mt-8 mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xl font-semibold text-primary mt-6 mb-3">{children}</h3>,
                        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-outside mb-4 space-y-1 ml-5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-outside mb-4 space-y-1 ml-5">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        a: ({ ...props }) => (
                            <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent font-medium transition-all duration-200 rounded hover:bg-accent/10 hover:shadow-sm"
                            />
                        ),
                        blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-accent/50 pl-4 italic my-4 text-neutral-600 dark:text-neutral-500">
                                {children}
                            </blockquote>
                        ),
                        strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                        em: ({ children }) => <em className="italic text-neutral-600 dark:text-neutral-500">{children}</em>,
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </motion.div>
    );
}
