import { prisma } from './client';

export interface CanonicalBusinessInfo {
  canonicalSlug: string;
  defaultId: string;
  displayName: string;
}

export const CANONICAL_BUSINESS_DIRECTORY: Record<string, CanonicalBusinessInfo> = {
  'prefab-construction': {
    canonicalSlug: 'prefab-construction',
    defaultId: 'b1000000-0000-0000-0000-000000000001',
    displayName: 'Prefab Construction Solutions',
  },
  'horeca-essentials': {
    canonicalSlug: 'horeca-essentials',
    defaultId: 'b1000000-0000-0000-0000-000000000002',
    displayName: 'HoReCa Essentials & Crockery Rental',
  },
  'crockery-rental': {
    canonicalSlug: 'horeca-essentials',
    defaultId: 'b1000000-0000-0000-0000-000000000002',
    displayName: 'HoReCa Essentials & Crockery Rental',
  },
  'essentials-sales': {
    canonicalSlug: 'horeca-essentials',
    defaultId: 'b1000000-0000-0000-0000-000000000002',
    displayName: 'HoReCa Essentials & Crockery Rental',
  },
  'gentle-hair-wigs': {
    canonicalSlug: 'gentle-hair-wigs',
    defaultId: 'b1000000-0000-0000-0000-000000000003',
    displayName: 'Gentle Hair Wigs Studio',
  },
  '3': {
    canonicalSlug: 'gentle-hair-wigs',
    defaultId: 'b1000000-0000-0000-0000-000000000003',
    displayName: 'Gentle Hair Wigs Studio',
  },
  'ecolab-distribution': {
    canonicalSlug: 'ecolab-distribution',
    defaultId: 'b1000000-0000-0000-0000-000000000004',
    displayName: 'Ecolab Institutional Distribution',
  },
  'hs-coworking': {
    canonicalSlug: 'hs-coworking',
    defaultId: 'b1000000-0000-0000-0000-000000000005',
    displayName: 'HS Co-working Spaces',
  },
  'first-mover-advantage': {
    canonicalSlug: 'first-mover-advantage',
    defaultId: 'b1000000-0000-0000-0000-000000000006',
    displayName: 'First Mover Advantage',
  },
  'adjs': {
    canonicalSlug: 'adjs',
    defaultId: 'b1000000-0000-0000-0000-000000000007',
    displayName: 'ADJS - PRINTBOOTH™',
  },
  'printbooth': {
    canonicalSlug: 'adjs',
    defaultId: 'b1000000-0000-0000-0000-000000000007',
    displayName: 'ADJS - PRINTBOOTH™',
  },
  'dvr-enterprise': {
    canonicalSlug: 'dvr-enterprise',
    defaultId: 'b1000000-0000-0000-0000-000000000008',
    displayName: 'DVR Enterprise',
  },
  'nda-services': {
    canonicalSlug: 'nda-services',
    defaultId: 'b1000000-0000-0000-0000-000000000009',
    displayName: 'NDA Security & Facility Care',
  },
  'hs-real-estate': {
    canonicalSlug: 'hs-real-estate',
    defaultId: 'b1000000-0000-0000-0000-000000000010',
    displayName: 'HS Real Estate & Assets',
  },
};

/**
 * Resolves any business identifier (slug, alias, legacy number, or UUID)
 * to its authoritative PostgreSQL Business record.
 */
export async function resolveBusiness(slugOrId: string | null | undefined) {
  if (!slugOrId) return null;
  const clean = slugOrId.trim();
  const meta = CANONICAL_BUSINESS_DIRECTORY[clean];
  const targetSlug = meta ? meta.canonicalSlug : clean;
  const targetDefaultId = meta ? meta.defaultId : clean;

  const biz = await prisma.business.findFirst({
    where: {
      OR: [
        { id: clean },
        { id: targetDefaultId },
        { slug: targetSlug },
        { slug: clean },
      ],
    },
  });

  return biz;
}

/**
 * Returns the canonical business ID (UUID) or fallback to canonical default UUID.
 */
export async function resolveBusinessId(slugOrId: string | null | undefined): Promise<string> {
  const biz = await resolveBusiness(slugOrId);
  if (biz?.id) return biz.id;

  const clean = (slugOrId || '').trim();
  const meta = CANONICAL_BUSINESS_DIRECTORY[clean];
  return meta?.defaultId || clean;
}
