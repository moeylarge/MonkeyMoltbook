'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuthCookieName, getExpectedPassword, makeAuthToken } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const password = String(formData.get('password') || '');
  const next = String(formData.get('next') || '/');

  if (!getExpectedPassword() || password !== getExpectedPassword()) {
    redirect('/login?error=1');
  }

  const cookieStore = await cookies();
  cookieStore.set(getAuthCookieName(), makeAuthToken(password), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(next || '/');
}
