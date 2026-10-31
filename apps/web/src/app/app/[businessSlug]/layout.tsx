import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession, SUPER_ADMIN_COOKIE, USER_SESSION_COOKIE } from '@/lib/authSession';

export const dynamic = 'force-dynamic';

interface BusinessLayoutProps {
  children: ReactNode;
  params: {
    businessSlug: string;
  };
}

export default async function BusinessWorkspaceLayout({
  children,
  params,
}: BusinessLayoutProps) {
  const { businessSlug } = params;

  // 1. Allow Super Admin access to any business workspace
  const saToken = cookies().get(SUPER_ADMIN_COOKIE)?.value;
  if (saToken) {
    const saPayload = await verifySession(saToken);
    if (saPayload?.isSuperAdmin) {
      return <>{children}</>;
    }
  }

  // 2. Otherwise verify business staff session matches this business
  const userToken = cookies().get(USER_SESSION_COOKIE)?.value;
  if (!userToken) {
    redirect(`/signin/${businessSlug}`);
  }

  const userPayload = await verifySession(userToken);
  if (!userPayload || userPayload.businessSlug !== businessSlug) {
    redirect(`/signin/${businessSlug}`);
  }

  return <>{children}</>;
}

