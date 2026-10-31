import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession, SUPER_ADMIN_COOKIE } from '@/lib/authSession';

export const dynamic = 'force-dynamic';

export default async function BackupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = cookies().get(SUPER_ADMIN_COOKIE)?.value;
  if (!token) {
    redirect('/super-admin/signin');
  }

  const payload = await verifySession(token);
  if (!payload || !payload.isSuperAdmin) {
    redirect('/super-admin/signin');
  }

  return <>{children}</>;
}
