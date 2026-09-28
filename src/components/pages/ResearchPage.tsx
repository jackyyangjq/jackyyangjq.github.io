'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { ResearchPageConfig, ResearchItem } from '@/types/page';
import { useMessages } from '@/lib/i18n/useMessages';

const inlineMarkdown = {
    p: ({ children }: React.ComponentProps<'p'>) => <p className="mb-2 last:mb-0">{children}</p>,
    a: ({ ...props }) => (
        <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent font-medium hover:underline underline-offset-4"
        />
    ),
    strong: ({ children }: React.ComponentProps<'strong'>) => <strong className="font-semibold text-primary">{children}</strong>,
    em: ({ children }: React.ComponentProps<'em'>) => <em className="italic">{children}</em>,
};

export const authorMarkdown = {
    p: ({ children }: React.ComponentProps<'p'>) => <p>{children}</p>,
    strong: ({ children }: React.ComponentProps<'strong'>) => <strong className="font-semibold text-primary">{children}</strong>,
};

export function StatusBadge({ status, venue }: { status?: string; venue?: string }) {
    if (!status && !venue) return null;
    return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
            {status && (
                <span className="inline-flex items-center rounded-full bg-accent/10 text-accent border border-accent/20 px-2.5 py-0.5 font-semibold tracking-wide">
                    {status}
                </span>
            )}
            {venue && (
                <span className="font-serif italic text-sm text-neutral-700 dark:text-neutral-600">{venue}</span>
            )}
        </div>
    );
}

function ResearchCard({ item, index }: { item: ResearchItem; index: number }) {
    const messages = useMessages();

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * index }}
            className="card-bg p-5 sm:p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow duration-200"
        >
            <div className="flex flex-col md:flex-row gap-6">
                {item.figure && (
                    <figure className="figure-frame w-full md:w-72 flex-shrink-0">
                        <a
                            href={item.figure}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative aspect-[4/3] rounded-lg overflow-hidden bg-white border border-neutral-200 dark:border-neutral-800 hover:border-accent/50 transition-colors"
                            title={item.figure_alt || item.title}
                        >
                            <Image
                                src={item.figure}
                                alt={item.figure_alt || item.title}
                                fill
                                className="object-contain p-1.5"
                                sizes="(max-width: 768px) 100vw, 288px"
                            />
                        </a>
                        {item.figure_caption && (
                            <figcaption className="mt-2 text-xs text-neutral-500 leading-snug">{item.figure_caption}</figcaption>
                        )}
                    </figure>
                )}
                <div className="flex-grow min-w-0">
                    <StatusBadge status={item.status} venue={item.venue} />
                    <h3 className="mt-2 text-lg font-semibold text-primary leading-snug">{item.title}</h3>
                    {item.authorship && (
                        <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-500">
                            <ReactMarkdown components={authorMarkdown}>{item.authorship}</ReactMarkdown>
                        </div>
                    )}
                    {item.award && (
                        <p className="mt-2 text-sm font-medium text-accent">{item.award}</p>
                    )}
                    {item.summary && (
                        <div className="mt-3 text-sm text-neutral-700 dark:text-neutral-600 leading-relaxed">
                            <ReactMarkdown components={inlineMarkdown}>{item.summary}</ReactMarkdown>
                        </div>
                    )}
                    {item.finding && (
                        <div className="mt-3 text-sm leading-relaxed border-l-2 border-accent/60 pl-3 text-neutral-700 dark:text-neutral-600">
                            <span className="font-semibold text-primary">{messages.research.finding}: </span>
                            {item.finding}
                        </div>
                    )}
                    {item.methods && item.methods.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {item.methods.map((method) => (
                                <span
                                    key={method}
                                    className="text-xs text-neutral-600 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded"
                                >
                                    {method}
                                </span>
                            ))}
                        </div>
                    )}
                    {item.links && item.links.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {item.links.map((link) => (
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
        </motion.article>
    );
}

export default function ResearchPage({ config, embedded = false }: { config: ResearchPageConfig; embedded?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
        >
            <div className={embedded ? 'mb-4' : 'mb-8'}>
                <h1 className={`${embedded ? 'text-2xl' : 'text-4xl'} font-serif font-bold text-primary mb-4`}>{config.title}</h1>
                {config.description && (
                    <div className={`${embedded ? 'text-base' : 'text-lg'} text-neutral-600 dark:text-neutral-500 max-w-3xl leading-relaxed`}>
                        <ReactMarkdown components={inlineMarkdown}>{config.description}</ReactMarkdown>
                    </div>
                )}
            </div>

            <div className="space-y-12">
                {config.groups.map((group) => (
                    <section key={group.id} id={group.id} className="scroll-mt-24">
                        <h2 className="text-2xl font-serif font-bold text-primary mb-2">{group.title}</h2>
                        {group.description && (
                            <div className="text-sm text-neutral-600 dark:text-neutral-500 mb-5 max-w-3xl leading-relaxed">
                                <ReactMarkdown components={inlineMarkdown}>{group.description}</ReactMarkdown>
                            </div>
                        )}
                        <div className="space-y-5">
                            {(group.items || []).map((item, index) => (
                                <ResearchCard key={item.title} item={item} index={index} />
                            ))}
                        </div>
                    </section>
                ))}

                {config.method_areas && config.method_areas.length > 0 && (
                    <section id="methods" className="scroll-mt-24">
                        {config.methods_title && (
                            <h2 className="text-2xl font-serif font-bold text-primary mb-2">{config.methods_title}</h2>
                        )}
                        {config.methods_description && (
                            <div className="text-sm text-neutral-600 dark:text-neutral-500 mb-5 max-w-3xl leading-relaxed">
                                <ReactMarkdown components={inlineMarkdown}>{config.methods_description}</ReactMarkdown>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {config.method_areas.map((area, index) => (
                                <motion.div
                                    key={area.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.06 * index }}
                                    className="card-bg p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col"
                                >
                                    <h3 className="font-semibold text-primary mb-3">{area.title}</h3>
                                    <ul className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-600 flex-grow">
                                        {area.methods.map((method) => (
                                            <li key={method} className="flex gap-2">
                                                <span className="mt-2 h-1 w-1 rounded-full bg-accent flex-shrink-0" aria-hidden="true" />
                                                <span>{method}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {area.link && (
                                        <a
                                            href={area.link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline underline-offset-4"
                                        >
                                            {area.link.label}
                                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                                        </a>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {config.note && (
                    <p className="text-xs text-neutral-500 leading-relaxed max-w-3xl">{config.note}</p>
                )}
            </div>
        </motion.div>
    );
}
