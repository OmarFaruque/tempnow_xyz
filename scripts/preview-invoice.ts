/**
 * Developer preview for the invoice template.
 *
 * Renders a set of realistic invoices straight into `tmp/invoice-preview/`,
 * so the design can be reviewed (and pinned in a PR) without going through a
 * checkout. No database needed — pass `--settings` to skip even the settings
 * read.
 *
 * Usage:
 *   pnpm tsx scripts/preview-invoice.ts            # all samples
 *   pnpm tsx scripts/preview-invoice.ts paid uae   # only these samples
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { generateInvoicePdf } from '../lib/invoice';
import type { InvoiceOptions } from '../lib/invoice/types';

const OUTPUT_DIR = path.join(process.cwd(), 'tmp', 'invoice-preview');

interface Sample {
    name: string;
    description: string;
    quoteData: Record<string, any>;
    user: Record<string, any>;
    policyNumber: string;
    settings: Record<string, any>;
    options: InvoiceOptions;
}

const baseCustomer = {
    firstName: 'Amelia',
    middleName: 'Rose',
    lastName: 'Hughes',
    dateOfBirth: '14/07/1993',
    phoneNumber: '+44 7700 900123',
    occupation: 'Architect',
    address: '42 Marlborough Crescent, Flat 6',
    post_code: 'SW1A 1AA',
    licenseType: 'Full UK License',
    licenseHeld: '5-10 Years',
    vehicleValue: '£20,000 - £30,000',
    reason: 'Borrowing',
    duration: '1 Day',
    registration: 'LK23 ZWA',
    vehicle: { make: 'Audi', model: 'A3 Sportback', year: '2021', engineCC: '1498' },
};

const baseUser = {
    userId: 'usr_9f21c4',
    firstName: 'Amelia',
    lastName: 'Hughes',
    email: 'amelia.hughes@example.com',
    phone: '+44 7700 900123',
    address: '42 Marlborough Crescent, Flat 6',
    postCode: 'SW1A 1AA',
};

const baseQuote = {
    ...{
        nameTitle: 'Mrs',
        total: 24.51,
        cpw: '32.80',
        startTime: '18/10/2026 14:00',
        expiryTime: '19/10/2026 13:59',
        breakdown: { duration: '1 Day', reason: 'Borrowing' },
        customerData: baseCustomer,
        vehicleModifications: ['None'],
    },
};

const ukSettings = {
    siteName: 'Tempnow',
    companyName: 'Tempnow Ltd',
    companyRegistration: '12849301',
    companyAddress: 'Suite 4, 118 Piccadilly, London W1J 7NW',
    supportEmail: 'support@tempnow.uk',
    companyPhone: '+44 20 3856 1120',
    siteDomain: 'tempnow.uk',
    brandColor: '#0d9488',
    currency: 'GBP',
    timezone: 'Europe/London',
    activeJurisdiction: 'uk',
    invoiceTaxRate: 0,
    invoiceDueDays: 7,
};

const samples: Sample[] = [
    {
        name: 'paid',
        description: 'Settled invoice with promotion code (the common path)',
        quoteData: { ...baseQuote, promoCode: 'WELCOME10' },
        user: baseUser,
        policyNumber: 'P-2427427',
        settings: ukSettings,
        options: {
            payment: {
                paid: true,
                method: 'stripe',
                reference: 'pi_3Qk8sdK2eZvKYlo2C1x9QpRt',
                date: '2026-10-08T11:32:00.000Z',
                status: 'paid',
                promoCode: 'WELCOME10',
                listAmount: 32.8,
                amount: 24.51,
            },
        },
    },
    {
        name: 'unpaid',
        description: 'Invoice awaiting payment, with a due date',
        quoteData: { ...baseQuote, total: 41.2, cpw: '41.20', promoCode: '' },
        user: { ...baseUser, firstName: 'Daniel', lastName: 'Okonkwo', email: 'daniel.okonkwo@example.com' },
        policyNumber: 'P-500679399',
        settings: ukSettings,
        options: {
            payment: { paid: false, status: 'pending', method: 'bank_transfer' },
        },
    },
    {
        name: 'tax',
        description: 'Tax invoice: 5% VAT added on top of the premium',
        quoteData: { ...baseQuote, total: 157.5 },
        user: { ...baseUser, firstName: 'Fatima', lastName: 'Al Mansoori', email: 'fatima.almansoori@example.com' },
        policyNumber: 'P-7712045',
        settings: {
            siteName: 'Tempnow UAE',
            companyName: 'Tempnow Insurance Brokers LLC',
            companyRegistration: 'DED 889201',
            companyAddress: 'Office 1204, Business Bay Tower, Dubai, UAE',
            supportEmail: 'support@tempnow.ae',
            siteDomain: 'tempnow.ae',
            brandColor: '#c8a24a',
            currency: 'AED',
            timezone: 'Asia/Dubai',
            activeJurisdiction: 'uae',
            trn: '100298471500003',
            invoiceTaxRate: 5,
            invoiceTaxLabel: 'VAT',
            invoiceDueDays: 14,
        },
        options: {
            payment: {
                paid: true,
                method: 'airwallex',
                reference: 'awx_8842ff10',
                date: '2026-10-07T06:15:00.000Z',
                status: 'completed',
                listAmount: 177.5,
                amount: 157.5,
            },
        },
    },
    {
        name: 'logo',
        description: 'Wide horizontal logo — the page-2 header must not overlap it',
        quoteData: { ...baseQuote, promoCode: 'WELCOME10' },
        user: baseUser,
        policyNumber: 'P-2427427',
        settings: { ...ukSettings, logo: '/tempnow-logo-horizontal.png' },
        options: {
            payment: {
                paid: true,
                method: 'stripe',
                reference: 'pi_3Qk8sdK2eZvKYlo2C1x9QpRt',
                date: '2026-10-08T11:32:00.000Z',
                status: 'paid',
                promoCode: 'WELCOME10',
                listAmount: 32.8,
                amount: 24.51,
            },
        },
    },
    {
        name: 'edge',
        description: 'Long values, unicode name, no email — robustness sample',
        quoteData: {
            ...baseQuote,
            nameTitle: 'Prof',
            total: 1212.05,
            cpw: '1400',
            startTime: '01/12/2026 09:30',
            expiryTime: '31/12/2026 09:29',
            promoCode: 'FLEET2026',
            customerData: {
                ...baseCustomer,
                firstName: 'Zoë',
                middleName: '',
                lastName: 'Wiśniewska-Łącka',
                address: 'Apartment 12B, Riverside Wharf, 245 Upper Thames Street, Long Address District',
                post_code: 'EC4V 3PH',
                vehicle: { make: 'Mercedes-Benz', model: 'Sprinter 315 CDI Premium Plus', year: '2023', engineCC: '1950' },
                registration: 'BJ72 KLM',
                reason: 'Buying/Selling/Testing',
                duration: '30 Days',
            },
            vehicleModifications: ['Roof rack', 'Tow bar', 'Company livery wrap'],
        },
        user: baseUser,
        policyNumber: 'P-0000001',
        settings: { ...ukSettings, invoiceTaxRate: 12, invoiceTaxInclusive: true, invoiceTaxLabel: 'Insurance Premium Tax' },
        options: {
            payment: {
                paid: true,
                method: 'square',
                reference: 'sq_pay_9f2h4k',
                date: '2026-10-01T08:05:00.000Z',
                status: 'completed',
                promoCode: 'FLEET2026',
                listAmount: 1400,
                amount: 1212.05,
            },
        },
    },
];

async function main() {
    const requested = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
    const selected = requested.length
        ? samples.filter((sample) => requested.includes(sample.name))
        : samples;

    mkdirSync(OUTPUT_DIR, { recursive: true });

    for (const sample of selected) {
        const bytes = await generateInvoicePdf(
            sample.quoteData,
            sample.user,
            sample.policyNumber,
            {
                generalSettings: sample.settings,
                options: sample.options,
            }
        );

        const file = path.join(OUTPUT_DIR, `invoice-${sample.name}.pdf`);
        writeFileSync(file, bytes);
        console.log(`✓ ${sample.name.padEnd(7)} ${(bytes.byteLength / 1024).toFixed(1)} KB  ${sample.description}`);
        console.log(`  ${file}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
