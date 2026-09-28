'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import type { SiteConfig } from '@/lib/config';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { useMessages } from '@/lib/i18n/useMessages';
import { projectEqualEarth, type ProjectionParams } from '@/lib/equalEarth';
import { OPT_OUT_KEY } from '@/components/ui/VisitTracker';

type LocalName = { en: string; zh: string };

interface WorldData {
    width: number;
    height: number;
    projection?: ProjectionParams;
    shapes: { code: string; name: LocalName; d: string }[];
    centroids: Record<string, { x: number; y: number; name: LocalName }>;
}

export interface VisitorData {
    generated_at?: string;
    since?: string;
    totals?: { visitors: number; pageviews: number; downloads?: number };
    countries?: { code: string; visitors: number }[];
    cities?: { city: string; country: string; lat?: number | null; lon?: number | null; visitors: number }[];
    referrers?: { domain: string; visitors: number }[];
    daily?: { date: string; visitors: number }[];
}

// Fixed bins so a colour always means the same count. Five steps of one hue.
const BIN_EDGES = [1, 3, 10, 30, 100];
const BIN_LABELS = ['1–2', '3–9', '10–29', '30–99', '100+'];

function binOf(value: number): number {
    let bin = -1;
    for (let i = 0; i < BIN_EDGES.length; i++) {
        if (value >= BIN_EDGES[i]) bin = i;
    }
    return bin;
}

function fillFor(value: number): string {
    const bin = binOf(value);
    return bin < 0 ? 'var(--map-empty)' : `var(--map-${bin})`;
}

function formatNumber(value: number, locale: string): string {
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-GB').format(value);
}

function formatDate(iso: string, locale: string, withYear = true): string {
    const date = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        ...(withYear ? { year: 'numeric' } : {}),
        timeZone: 'UTC',
    }).format(date);
}

function useJson<T>(url: string | undefined): { data: T | null; failed: boolean } {
    const [data, setData] = useState<T | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        if (!url) return;
        let cancelled = false;
        fetch(url, { cache: 'no-cache' })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
            .then((json) => { if (!cancelled) setData(json as T); })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => { cancelled = true; };
    }, [url]);
    return { data, failed };
}

interface TooltipState {
    x: number;
    y: number;
    label: string;
    value: number;
}

function StatTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="card-bg rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-3">
            <div className="text-xs text-neutral-500">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-primary font-sans">{value}</div>
        </div>
    );
}

function RankedList({ title, rows, locale, emptyText }: {
    title: string;
    rows: { label: string; sub?: string; value: number }[];
    locale: string;
    emptyText: string;
}) {
    const max = Math.max(1, ...rows.map((r) => r.value));
    return (
        <div>
            <h3 className="text-sm font-semibold text-primary mb-3">{title}</h3>
            {rows.length === 0 ? (
                <p className="text-sm text-neutral-500">{emptyText}</p>
            ) : (
                <ol className="space-y-2.5">
                    {rows.map((row) => (
                        <li key={`${row.label}-${row.sub || ''}`} className="text-sm">
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="text-neutral-700 dark:text-neutral-600 truncate">
                                    {row.label}
                                    {row.sub && <span className="text-neutral-500"> · {row.sub}</span>}
                                </span>
                                <span className="text-neutral-700 dark:text-neutral-600 tabular-nums">{formatNumber(row.value, locale)}</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden" aria-hidden="true">
                                <div
                                    className="h-full rounded-full"
                                    style={{ width: `${Math.max(3, (row.value / max) * 100)}%`, background: 'var(--chart-bar)' }}
                                />
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

function DailyChart({ daily, locale, title, unit, showTableLabel, dateLabel, visitorsLabel }: {
    daily: { date: string; visitors: number }[];
    locale: string;
    title: string;
    unit: string;
    showTableLabel: string;
    dateLabel: string;
    visitorsLabel: string;
}) {
    const [hover, setHover] = useState<number | null>(null);
    // Draw in real pixels so labels stay 11px whatever the screen width
    const wrapRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(640);
    useEffect(() => {
        const el = wrapRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver((entries) => {
            const w = Math.round(entries[0].contentRect.width);
            if (w > 0) setWidth(w);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    const plotHeight = 140;
    const axisBand = 22;
    const leftPad = 28;
    const slot = (width - leftPad) / Math.max(1, daily.length);
    const barWidth = Math.min(24, Math.max(4, slot - 4));
    const max = Math.max(1, ...daily.map((d) => d.visitors));
    const niceMax = max <= 5 ? max : Math.ceil(max / 5) * 5;
    const y = (v: number) => plotHeight - (v / niceMax) * (plotHeight - 8);

    const barPath = (x: number, top: number, w: number, bottom: number) => {
        const h = bottom - top;
        if (h <= 0) return '';
        const r = Math.min(4, w / 2, h);
        return `M${x},${bottom} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + w - r},${top} Q${x + w},${top} ${x + w},${top + r} L${x + w},${bottom} Z`;
    };

    const labelIdx = daily.length > 0 ? [0, Math.floor((daily.length - 1) / 2), daily.length - 1] : [];

    return (
        <div>
            <h3 className="text-sm font-semibold text-primary mb-3">{title}</h3>
            <div className="relative" ref={wrapRef}>
                <svg viewBox={`0 0 ${width} ${plotHeight + axisBand}`} width={width} height={plotHeight + axisBand} className="block max-w-full" role="img" aria-label={title}>
                    {[0, niceMax].map((tick) => (
                        <g key={tick}>
                            <line x1={leftPad} x2={width} y1={y(tick)} y2={y(tick)} stroke="var(--chart-grid)" strokeWidth={1} />
                            <text x={leftPad - 6} y={y(tick) + 4} textAnchor="end" fontSize={11} className="fill-neutral-500 tabular-nums">
                                {tick}
                            </text>
                        </g>
                    ))}
                    {daily.map((d, i) => {
                        const x = leftPad + i * slot + (slot - barWidth) / 2;
                        return (
                            <g
                                key={d.date}
                                onPointerEnter={() => setHover(i)}
                                onPointerLeave={() => setHover(null)}
                            >
                                <rect x={leftPad + i * slot} y={0} width={slot} height={plotHeight} fill="transparent" />
                                <path
                                    d={barPath(x, y(d.visitors), barWidth, plotHeight)}
                                    style={{ fill: 'var(--chart-bar)', opacity: hover === null || hover === i ? 1 : 0.55 }}
                                />
                            </g>
                        );
                    })}
                    {labelIdx.map((i) => (
                        <text
                            key={`label-${i}`}
                            x={leftPad + i * slot + slot / 2}
                            y={plotHeight + 16}
                            textAnchor={i === 0 ? 'start' : i === daily.length - 1 ? 'end' : 'middle'}
                            fontSize={11}
                            className="fill-neutral-500"
                        >
                            {formatDate(daily[i].date, locale, false)}
                        </text>
                    ))}
                </svg>
                {hover !== null && daily[hover] && (
                    <div
                        className="pointer-events-none absolute -top-2 rounded-md bg-primary px-3 py-2 text-xs shadow-lg z-10 whitespace-nowrap"
                        style={{ left: `${((leftPad + hover * slot + slot / 2) / width) * 100}%`, transform: 'translate(-50%, -100%)' }}
                    >
                        <div className="font-semibold text-background text-sm">
                            {formatNumber(daily[hover].visitors, locale)} {unit}
                        </div>
                        <div className="text-background/70">{formatDate(daily[hover].date, locale)}</div>
                    </div>
                )}
            </div>
            <details className="mt-2 text-xs text-neutral-500">
                <summary className="cursor-pointer hover:text-accent">{showTableLabel}</summary>
                <table className="mt-2 w-full max-w-sm text-left">
                    <thead>
                        <tr><th className="font-medium py-1">{dateLabel}</th><th className="font-medium py-1 text-right">{visitorsLabel}</th></tr>
                    </thead>
                    <tbody>
                        {daily.map((d) => (
                            <tr key={d.date} className="border-t border-neutral-200 dark:border-neutral-800">
                                <td className="py-1">{formatDate(d.date, locale)}</td>
                                <td className="py-1 text-right tabular-nums">{formatNumber(d.visitors, locale)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </div>
    );
}

interface VisitorMapProps {
    title?: string;
    description?: string;
    analytics?: SiteConfig['analytics'];
    variant?: 'compact' | 'full';
    detailsHref?: string;
}

function OptOutSwitch() {
    const messages = useMessages();
    const [optedOut, setOptedOut] = useState<boolean | null>(null);
    useEffect(() => {
        try {
            setOptedOut(localStorage.getItem(OPT_OUT_KEY) === '1');
        } catch {
            setOptedOut(null);
        }
    }, []);
    if (optedOut === null) return null;
    const toggle = () => {
        try {
            if (optedOut) localStorage.removeItem(OPT_OUT_KEY);
            else localStorage.setItem(OPT_OUT_KEY, '1');
            setOptedOut(!optedOut);
        } catch {
            // storage blocked: nothing to change
        }
    };
    return (
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-neutral-500">
            <span>{optedOut ? messages.visitors.optedOut : messages.visitors.optOutHint}</span>
            <button
                type="button"
                onClick={toggle}
                className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:border-accent hover:text-accent transition-colors"
            >
                {optedOut ? messages.visitors.optIn : messages.visitors.optOut}
            </button>
        </div>
    );
}

export default function VisitorMap({ title, description, analytics, variant = 'compact', detailsHref = '/visitors/' }: VisitorMapProps) {
    const locale = useLocaleStore((state) => state.locale) === 'zh' ? 'zh' : 'en';
    const messages = useMessages();
    const { data: world } = useJson<WorldData>('/data/world.json');
    const { data: stats, failed } = useJson<VisitorData>(analytics?.map_data || '/data/visitors.json');
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    const byCountry = useMemo(() => {
        const map = new Map<string, number>();
        for (const row of stats?.countries || []) map.set(row.code, row.visitors);
        return map;
    }, [stats]);

    const nameOf = (code: string): string => {
        const shape = world?.shapes.find((s) => s.code === code);
        const centroid = world?.centroids[code];
        return (shape?.name || centroid?.name)?.[locale] || code;
    };

    const outlined = useMemo(() => new Set((world?.shapes || []).map((s) => s.code)), [world]);
    const dots = useMemo(() => {
        if (!world) return [];
        return [...byCountry.entries()]
            .filter(([code, v]) => v > 0 && !outlined.has(code) && world.centroids[code])
            .map(([code, v]) => ({ code, value: v, ...world.centroids[code] }));
    }, [world, byCountry, outlined]);

    const cityDots = useMemo(() => {
        if (!world?.projection) return [];
        const rows = (stats?.cities || []).filter(
            (c) => typeof c.lat === 'number' && typeof c.lon === 'number' && c.visitors > 0,
        );
        const max = Math.max(1, ...rows.map((c) => c.visitors));
        return rows
            .map((c) => {
                const [x, y] = projectEqualEarth(c.lon as number, c.lat as number, world.projection as ProjectionParams);
                return { ...c, x, y, r: 3 + 5 * Math.sqrt(c.visitors / max) };
            })
            .sort((a, b) => b.visitors - a.visitors);
    }, [world, stats]);

    const showTip = (event: React.PointerEvent, label: string, value: number) => {
        const box = mapRef.current?.getBoundingClientRect();
        if (!box) return;
        setTooltip({ x: event.clientX - box.left, y: event.clientY - box.top, label, value });
    };

    const totals = stats?.totals;
    const countryCount = [...byCountry.values()].filter((v) => v > 0).length;
    const hasVisits = (totals?.visitors || 0) > 0;
    const unit = (n: number) => (n === 1 ? messages.visitors.visitorUnit : messages.visitors.visitorsUnit);

    const byValue = <T extends { visitors: number }>(rows: T[] | undefined) =>
        [...(rows || [])].filter((r) => r.visitors > 0).sort((a, b) => b.visitors - a.visitors).slice(0, 10);
    const countryRows = byValue(stats?.countries).map((c) => ({ label: nameOf(c.code), value: c.visitors }));
    const cityRows = byValue(stats?.cities).map((c) => {
        const country = nameOf(c.country);
        // Hong Kong, Macao, Singapore: the city and the place are the same, so skip the second label
        const redundant = country.toLowerCase().includes(c.city.toLowerCase()) || c.city.toLowerCase().includes(country.toLowerCase());
        return { label: c.city, sub: redundant ? undefined : country, value: c.visitors };
    });
    const referrerRows = byValue(stats?.referrers).map((r) => ({ label: r.domain || messages.visitors.direct, value: r.visitors }));

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            aria-labelledby="visitors-heading"
        >
            <div className="flex items-end justify-between gap-4 mb-1">
                {variant === 'full' ? (
                    <h1 id="visitors-heading" className="text-4xl font-serif font-bold text-primary">{title || messages.visitors.title}</h1>
                ) : (
                    <h2 id="visitors-heading" className="text-2xl font-serif font-bold text-primary">{title || messages.visitors.title}</h2>
                )}
                {variant === 'compact' && (
                    <Link href={detailsHref} className="text-accent hover:text-accent-dark text-sm font-medium whitespace-nowrap">
                        {messages.visitors.seeDetails} →
                    </Link>
                )}
            </div>
            {(description || stats?.since) && (
                <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-4">
                    {description}
                    {stats?.since && (
                        <span className="text-neutral-500">
                            {description ? ' ' : ''}({messages.visitors.since} {formatDate(stats.since, locale)})
                        </span>
                    )}
                </p>
            )}

            <div className="grid grid-cols-3 gap-3 mb-4">
                <StatTile label={messages.visitors.visitors} value={totals ? formatNumber(totals.visitors, locale) : '–'} />
                <StatTile label={messages.visitors.pageviews} value={totals ? formatNumber(totals.pageviews, locale) : '–'} />
                <StatTile label={messages.visitors.countries} value={stats ? formatNumber(countryCount, locale) : '–'} />
            </div>

            <div ref={mapRef} className="relative card-bg rounded-xl border border-neutral-200 dark:border-neutral-800 p-2 sm:p-3">
                {world ? (
                    <svg
                        viewBox={`0 0 ${world.width} ${world.height}`}
                        className="w-full h-auto"
                        role="img"
                        aria-label={messages.visitors.mapLabel}
                        onPointerLeave={() => setTooltip(null)}
                    >
                        {world.shapes.map((shape) => {
                            const value = byCountry.get(shape.code) || 0;
                            return (
                                <path
                                    key={shape.code}
                                    d={shape.d}
                                    style={{ fill: fillFor(value), stroke: 'var(--map-border)', strokeWidth: 0.6 }}
                                    className={value > 0 ? 'transition-opacity hover:opacity-80' : undefined}
                                    onPointerMove={(e) => showTip(e, nameOf(shape.code), value)}
                                />
                            );
                        })}
                        {dots.map((dot) => (
                            <g key={dot.code} onPointerMove={(e) => showTip(e, nameOf(dot.code), dot.value)}>
                                <circle cx={dot.x} cy={dot.y} r={14} fill="transparent" />
                                <circle cx={dot.x} cy={dot.y} r={5.5} style={{ fill: fillFor(dot.value), stroke: 'var(--surface)', strokeWidth: 2.5 }} />
                            </g>
                        ))}
                        {cityDots.map((c) => (
                            <g
                                key={`${c.city}-${c.country}`}
                                onPointerMove={(e) => showTip(e, `${c.city} · ${nameOf(c.country)}`, c.visitors)}
                            >
                                <circle cx={c.x} cy={c.y} r={Math.max(12, c.r + 6)} fill="transparent" />
                                <circle cx={c.x} cy={c.y} r={c.r} style={{ fill: 'var(--map-dot)', fillOpacity: 0.88, stroke: 'var(--surface)', strokeWidth: 1.5 }} />
                            </g>
                        ))}
                    </svg>
                ) : (
                    <div className="aspect-[1000/470] w-full rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                )}
                {tooltip && (
                    <div
                        className="pointer-events-none absolute z-10 rounded-md bg-primary px-3 py-2 text-xs shadow-lg whitespace-nowrap"
                        style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, calc(-100% - 12px))' }}
                    >
                        <div className="font-semibold text-sm text-background">
                            {formatNumber(tooltip.value, locale)} {unit(tooltip.value)}
                        </div>
                        <div className="text-background/70">{tooltip.label}</div>
                    </div>
                )}
                {!hasVisits && (
                    <p className="absolute inset-x-0 bottom-3 text-center text-xs text-neutral-500">
                        {failed ? messages.visitors.unavailable : !stats ? messages.visitors.loading : messages.visitors.noneYet}
                    </p>
                )}
            </div>

            {/* Legend: one swatch per bin, plus the empty state */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-600 dark:text-neutral-500" aria-hidden="true">
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm border border-neutral-300 dark:border-neutral-700" style={{ background: 'var(--map-empty)' }} />
                    {messages.visitors.legendNone}
                </span>
                {BIN_LABELS.map((label, i) => (
                    <span key={label} className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-sm" style={{ background: `var(--map-${i})` }} />
                        {label}
                    </span>
                ))}
                <span className="text-neutral-500">{messages.visitors.visitorsUnit}</span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--map-dot)' }} />
                    {messages.visitors.cityDot}
                </span>
            </div>

            {variant === 'full' && (
                <div className="mt-10 space-y-10">
                    {stats?.daily && stats.daily.length > 0 && (
                        <DailyChart
                            daily={stats.daily}
                            locale={locale}
                            title={messages.visitors.daily}
                            unit={messages.visitors.visitorsUnit}
                            showTableLabel={messages.visitors.showTable}
                            dateLabel={messages.visitors.date}
                            visitorsLabel={messages.visitors.visitors}
                        />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <RankedList title={messages.visitors.countries} rows={countryRows} locale={locale} emptyText="–" />
                        <RankedList title={messages.visitors.cities} rows={cityRows} locale={locale} emptyText="–" />
                        <RankedList title={messages.visitors.referrers} rows={referrerRows} locale={locale} emptyText="–" />
                    </div>
                </div>
            )}

            {variant === 'full' && (
                <div className="mt-6">
                    <OptOutSwitch />
                </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-neutral-500">
                <p>
                    {messages.visitors.privacy}
                    {stats?.generated_at && (
                        <> {messages.visitors.updated} {formatDate(stats.generated_at, locale)}.</>
                    )}
                </p>
                {variant === 'full' && analytics?.share_url && (
                    <a
                        href={analytics.share_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-accent hover:underline underline-offset-4 whitespace-nowrap"
                    >
                        {messages.visitors.fullStats}
                        <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                    </a>
                )}
            </div>
        </motion.section>
    );
}
