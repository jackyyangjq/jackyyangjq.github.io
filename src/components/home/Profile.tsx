'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { EnvelopeIcon, AcademicCapIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { EnvelopeIcon as EnvelopeSolidIcon } from '@heroicons/react/24/solid';
import { Github, Linkedin, Pin } from 'lucide-react';
import type { SiteConfig } from '@/lib/config';
import { useMessages } from '@/lib/i18n/useMessages';

// Custom ORCID icon component
const OrcidIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722h-2.222z" />
    </svg>
);

interface ProfileProps {
    author: SiteConfig['author'];
    social: SiteConfig['social'];
    features: SiteConfig['features'];
    cv?: SiteConfig['cv'];
    researchInterests?: string[];
}

export default function Profile({ author, social, cv, researchInterests }: ProfileProps) {
    const messages = useMessages();

    const [showEmail, setShowEmail] = useState(false);
    const [isEmailPinned, setIsEmailPinned] = useState(false);

    const emails = social.emails && social.emails.length > 0
        ? social.emails
        : (social.email ? [social.email] : []);

    const linkIcons = [
        ...(social.linkedin ? [{ name: 'LinkedIn', href: social.linkedin, icon: Linkedin }] : []),
        ...(social.github ? [{ name: 'GitHub', href: social.github, icon: Github }] : []),
        ...(social.google_scholar ? [{ name: 'Google Scholar', href: social.google_scholar, icon: AcademicCapIcon }] : []),
        ...(social.orcid ? [{ name: 'ORCID', href: social.orcid, icon: OrcidIcon }] : []),
    ];

    const affiliations = author.affiliations && author.affiliations.length > 0
        ? author.affiliations
        : [author.institution];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-24"
        >
            {/* Profile Image */}
            <div className="w-52 h-52 sm:w-60 sm:h-60 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10 hover:shadow-xl transition-all duration-200">
                <Image
                    src={author.avatar}
                    alt={author.name}
                    width={256}
                    height={256}
                    className="w-full h-full object-cover object-center"
                    priority
                />
            </div>

            {/* Name and Title */}
            <div className="text-center mb-5">
                <h1 className="text-3xl font-serif font-bold text-primary mb-1 tracking-tight">
                    {author.name}
                </h1>
                {author.name_note && (
                    <p className="text-sm text-neutral-500 mb-2">{author.name_note}</p>
                )}
                <p className="text-lg text-accent font-medium mb-2">
                    {author.title}
                </p>
                <div className="text-neutral-600 dark:text-neutral-500 text-sm leading-relaxed space-y-0.5">
                    {affiliations.map((line) => (
                        <p key={line}>{line}</p>
                    ))}
                </div>
            </div>

            {/* CV downloads */}
            {cv && cv.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {cv.map((item, index) => (
                        <a
                            key={item.href}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-umami-event="cv-download"
                            data-umami-event-version={item.label}
                            title={item.note}
                            className={
                                index === 0
                                    ? 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-dark dark:text-neutral-50 transition-colors duration-200 shadow-sm'
                                    : 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-accent/40 text-accent hover:bg-accent/10 transition-colors duration-200'
                            }
                        >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            {item.label}
                        </a>
                    ))}
                </div>
            )}

            {/* Contact Links */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6 relative px-2">
                {emails.length > 0 && (
                    <div className="relative">
                        <button
                            onMouseEnter={() => { if (!isEmailPinned) setShowEmail(true); }}
                            onMouseLeave={() => !isEmailPinned && setShowEmail(false)}
                            onClick={() => {
                                setIsEmailPinned(!isEmailPinned);
                                setShowEmail(!isEmailPinned);
                            }}
                            className={`p-2 transition-colors duration-200 ${isEmailPinned
                                ? 'text-accent'
                                : 'text-neutral-600 dark:text-neutral-500 hover:text-accent'
                                }`}
                            aria-label={messages.profile.email}
                        >
                            {isEmailPinned ? (
                                <EnvelopeSolidIcon className="h-5 w-5" />
                            ) : (
                                <EnvelopeIcon className="h-5 w-5" />
                            )}
                        </button>

                        <AnimatePresence>
                            {(showEmail || isEmailPinned) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: -10, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-neutral-800 dark:bg-neutral-200 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg z-20 w-max max-w-[calc(100vw-2rem)]"
                                    onMouseEnter={() => { if (!isEmailPinned) setShowEmail(true); }}
                                    onMouseLeave={() => !isEmailPinned && setShowEmail(false)}
                                >
                                    <div className="text-center">
                                        <div className="flex items-center justify-center space-x-2 mb-2">
                                            <p className="font-semibold">{messages.profile.email}</p>
                                            {!isEmailPinned && (
                                                <div className="flex items-center space-x-0.5 text-xs text-neutral-400 opacity-70">
                                                    <Pin className="h-2.5 w-2.5" />
                                                    <span className="hidden sm:inline">{messages.profile.click}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {emails.map((address) => (
                                                <a
                                                    key={address}
                                                    href={`mailto:${address}`}
                                                    data-umami-event="email-click"
                                                    className="flex items-center justify-center gap-2 rounded-md px-3 py-1.5 bg-white/10 hover:bg-accent transition-colors duration-200 text-xs break-all"
                                                >
                                                    <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
                                                    <span>{address.replace('@', ' (at) ')}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800 dark:border-t-neutral-200"></div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
                {linkIcons.map((link) => {
                    const IconComponent = link.icon;
                    return (
                        <a
                            key={link.name}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-neutral-600 dark:text-neutral-500 hover:text-accent transition-colors duration-200"
                            aria-label={link.name}
                            title={link.name}
                        >
                            <IconComponent className="h-5 w-5" />
                        </a>
                    );
                })}
            </div>

            {/* Research Interests */}
            {researchInterests && researchInterests.length > 0 && (
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-primary mb-3">{messages.profile.researchInterests}</h3>
                    <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-500">
                        {researchInterests.map((interest, index) => (
                            <div key={index} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" aria-hidden="true" />
                                <span>{interest}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
