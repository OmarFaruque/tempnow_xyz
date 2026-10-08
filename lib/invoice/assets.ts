/**
 * Logo loading for invoices.
 *
 * The renderer embeds the site logo when it can find it, and silently falls
 * back to a typographic wordmark when it cannot — an unreachable CDN or a
 * missing upload must never stop an invoice from being generated (it used to
 * fail the whole confirmation email).
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { PDFDocument, PDFImage } from 'pdf-lib';

const FETCH_TIMEOUT_MS = 6000;
const MAX_LOGO_BYTES = 4 * 1024 * 1024;

export interface InvoiceLogo {
    image: PDFImage;
    /** Natural aspect ratio (width / height). */
    aspect: number;
}

function guessType(url: string, contentType: string | null): 'png' | 'jpg' | null {
    const type = (contentType || '').toLowerCase();
    if (type.includes('png')) return 'png';
    if (type.includes('jpeg') || type.includes('jpg') || type.includes('pjpeg')) return 'jpg';

    const ext = path.extname(url.split('?')[0]).toLowerCase();
    if (ext === '.png') return 'png';
    if (ext === '.jpg' || ext === '.jpeg') return 'jpg';

    // SVG logos cannot be embedded by pdf-lib and would need rasterising.
    return null;
}

async function readLocalFile(url: string): Promise<Buffer | null> {
    try {
        const clean = decodeURIComponent(url.split('?')[0]);
        const absolute = path.join(process.cwd(), 'public', clean.replace(/^\/+/, ''));
        const buffer = await fs.readFile(absolute);
        if (buffer.byteLength > MAX_LOGO_BYTES) return null;
        return buffer;
    } catch {
        return null;
    }
}

async function fetchRemote(url: string): Promise<{ buffer: Buffer; contentType: string | null } | null> {
    if (!/^https?:\/\//i.test(url)) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            cache: 'no-store',
            headers: { accept: 'image/png,image/jpeg,image/*' },
        });
        if (!response.ok) return null;

        const buffer = Buffer.from(await response.arrayBuffer());
        if (!buffer.byteLength || buffer.byteLength > MAX_LOGO_BYTES) return null;

        return { buffer, contentType: response.headers.get('content-type') };
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Try to load and embed the site logo. Returns `null` when unavailable so the
 * caller can render a wordmark instead.
 */
export async function loadInvoiceLogo(
    pdf: PDFDocument,
    logoUrl: string
): Promise<InvoiceLogo | null> {
    const url = (logoUrl || '').trim();
    if (!url || url.startsWith('data:')) return null;

    try {
        let buffer: Buffer | null = null;
        let contentType: string | null = null;

        if (/^https?:\/\//i.test(url)) {
            const remote = await fetchRemote(url);
            if (remote) {
                buffer = remote.buffer;
                contentType = remote.contentType;
            } else {
                // Some deployments point the logo at their own origin; if the
                // fetch fails, the file may still exist under /public.
                try {
                    const parsed = new URL(url);
                    buffer = await readLocalFile(parsed.pathname);
                    contentType = null;
                } catch {
                    buffer = null;
                }
            }
        } else {
            buffer = await readLocalFile(url);
        }

        if (!buffer) return null;

        const type = guessType(url, contentType);
        if (!type) return null;

        const image = type === 'png' ? await pdf.embedPng(buffer) : await pdf.embedJpg(buffer);
        const width = image.width || 1;
        const height = image.height || 1;

        return { image, aspect: width / height };
    } catch (error) {
        console.error('Invoice logo could not be embedded, falling back to wordmark.', error);
        return null;
    }
}
