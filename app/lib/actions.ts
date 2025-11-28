'use server';

import { AuthError } from 'next-auth';
import { fetchExpensesByDate } from '@/app/lib/data';

import { signIn } from '@/auth';

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials';
        default:
          return 'Something went wrong';
      }
    }
    throw error;
  }
}

export async function getExpensesByDay(day: Date) {
  'use server';
  return await fetchExpensesByDate(day);
}
