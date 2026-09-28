'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { CardItem, CardPageConfig } from '@/types/page';

const markdownComponents = {
    p: ({ children }: React.ComponentProps<'p'>) => <p className="mb-3 last:mb-0">{children}</p>,
    ul: ({ children }: React.ComponentProps<'ul'>) => <ul className="list-disc list-outside ml-5 mb-3 space-y-1">{children}</ul>,
    ol: ({ children }: React.ComponentProps<'ol'>) => <ol className="list-decimal list-outside ml-5 mb-3 space-y-1">{children}</ol>,
    li: ({ children }: React.ComponentProps<'li'>) => <li className="mb-1">{children}</li>,
    a: ({ ...props }) => (
        <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent font-medium transition-all duration-200 rounded hover:bg-accent/10"
        />
    ),
    blockquote: ({ children }: React.ComponentProps<'blockquote'>) => (
        <blockquote className="border-l-4 border-accent/50 pl-4 italic my-4 text-neutral-600 dark:text-neutral-500">
            {children}
        </blockquote>
    ),
    strong: ({ children }: React.ComponentProps<'strong'>) => <strong className="font-semibold text-primary">{children}</strong>,
    em: ({ children }: React.ComponentProps<'em'>) => <em className="italic">{children}</em>,
    code: ({ children }: React.ComponentProps<'code'>) => (
        <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[0.95em]">{children}</code>
    ),
};

function Card({ item, index, embedded, stacked = false }: { item: CardItem; index: number; embedded: boolean; stacked?: boolean }) {
    const links = item.links || (item.link ? [{ label: 'Link', href: item.link }] : []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 * index }}
            className={`card-bg ${embedded ? 'p-4' : 'p-5 sm:p-6'} rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow duration-200`}
        >
            <div className={`flex flex-col gap-5 ${stacked ? '' : 'md:flex-row'}`}>
                {item.image && (
                    <div className={`figure-frame w-full flex-shrink-0 ${stacked ? '' : 'md:w-56'}`}>
                        <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-neutral-50 border border-neutral-200 dark:border-neutral-800">
                            <Image
                                src={item.image}
                                alt={item.image_alt || item.title}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 224px"
                            />
                        </div>
                    </div>
                )}
                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-3 mb-1">
                        <h3 className={`${embedded ? 'text-lg' : 'text-lg sm:text-xl'} font-semibold text-primary leading-snug`}>{item.title}</h3>
                        {item.date && (
                            <span className="text-xs sm:text-sm text-neutral-500 font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                                {item.date}
                            </span>
                        )}
                    </div>
                    {item.subtitle && (
                        <p className={`${embedded ? 'text-sm' : 'text-sm sm:text-base'} text-accent font-medium mb-3`}>{item.subtitle}</p>
                    )}
                    {item.content && (
                        <div className="text-sm text-neutral-700 dark:text-neutral-600 leading-relaxed">
                            <ReactMarkdown components={markdownComponents}>
                                {item.content}
                            </ReactMarkdown>
                        </div>
                    )}
                    {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                            {item.tags.map(tag => (
                                <span key={tag} className="text-xs text-neutral-600 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    {links.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {links.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-600 hover:bg-accent hover:text-white dark:hover:text-neutral-50 transition-colors"
                                >
                                    {link.label}
                                    <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function CardPage({ config, embedded = false }: { config: CardPageConfig; embedded?: boolean }) {
    const groups = config.groups && config.groups.length > 0
        ? config.groups
        : [{ title: '', items: config.items || [] }];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
        >
            <div className={embedded ? "mb-4" : "mb-8"}>
                <h1 className={`${embedded ? "text-2xl" : "text-4xl"} font-serif font-bold text-primary mb-4`}>{config.title}</h1>
                {config.description && (
                    <div className={`${embedded ? "text-base" : "text-lg"} text-neutral-600 dark:text-neutral-500 max-w-3xl leading-relaxed`}>
                        <ReactMarkdown components={markdownComponents}>
                            {config.description}
                        </ReactMarkdown>
                    </div>
                )}
            </div>

            <div className="space-y-10">
                {groups.map((group, groupIndex) => (
                    <section key={group.title || groupIndex}>
                        {group.title && (
                            <h2 className="text-2xl font-serif font-bold text-primary mb-2">{group.title}</h2>
                        )}
                        {'description' in group && group.description && (
                            <div className="text-sm text-neutral-600 dark:text-neutral-500 mb-5 max-w-3xl leading-relaxed">
                                <ReactMarkdown components={markdownComponents}>{group.description}</ReactMarkdown>
                            </div>
                        )}
                        <div className={`grid ${embedded ? "gap-4" : "gap-5"} ${'layout' in group && group.layout === 'grid' ? 'md:grid-cols-2' : ''}`}>
                            {group.items.map((item, index) => (
                                <Card
                                    key={`${item.title}-${index}`}
                                    item={item}
                                    index={index}
                                    embedded={embedded}
                                    stacked={'layout' in group && group.layout === 'grid'}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </motion.div>
    );
}
