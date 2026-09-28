'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLocaleStore } from '@/lib/stores/localeStore';

// Cookie-free visit counting. Sends one small beacon per page view (and one per CV download) to the
// site's own counter. Nothing is sent when the visitor has opted out, when the browser signals
// Do Not Track or Global Privacy Control, or on a local preview.
export const OPT_OUT_KEY = 'jy-no-track';
const VISIT_KEY = 'jy-visit';

function trackingAllowed(): boolean {
    if (typeof window === 'undefined') return false;
    if (window.location.hostname !== 'jackieyangjq.github.io') return false;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === '1' || nav.globalPrivacyControl === true) return false;
    try {
        if (localStorage.getItem(OPT_OUT_KEY) === '1') return false;
    } catch {
        // storage blocked: still fine to count, nothing is stored
    }
    return true;
}

function send(endpoint: string, payload: Record<string, unknown>) {
    const body = JSON.stringify(payload);
    try {
        // A text/plain beacon needs no CORS preflight
        if (navigator.sendBeacon && navigator.sendBeacon(`${endpoint}/v`, body)) return;
    } catch {
        // fall through to fetch
    }
    fetch(`${endpoint}/v`, { method: 'POST', body, keepalive: true, mode: 'no-cors' }).catch(() => undefined);
}

export default function VisitTracker({ endpoint }: { endpoint?: string }) {
    const pathname = usePathname();
    const locale = useLocaleStore((state) => state.locale);
    const lastPath = useRef<string | null>(null);

    useEffect(() => {
        if (!endpoint || !trackingAllowed() || lastPath.current === pathname) return;
        const firstInSession = lastPath.current === null;
        lastPath.current = pathname;

        let newVisit = 0;
        try {
            if (!sessionStorage.getItem(VISIT_KEY)) {
                sessionStorage.setItem(VISIT_KEY, '1');
                newVisit = 1;
            }
        } catch {
            newVisit = firstInSession ? 1 : 0;
        }
        send(endpoint, { p: pathname, r: newVisit ? document.referrer : '', n: newVisit, t: 'view', l: locale });
    }, [endpoint, pathname, locale]);

    useEffect(() => {
        if (!endpoint) return;
        const onClick = (event: MouseEvent) => {
            const link = (event.target as HTMLElement | null)?.closest?.('a');
            if (!link || !trackingAllowed()) return;
            const url = new URL(link.href, window.location.href);
            if (url.origin === window.location.origin && url.pathname.endsWith('.pdf')) {
                send(endpoint, { p: url.pathname, t: 'download', l: document.documentElement.lang || 'en' });
            }
        };
        document.addEventListener('click', onClick, true);
        return () => document.removeEventListener('click', onClick, true);
    }, [endpoint]);

    return null;
}
