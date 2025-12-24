'use server';

import { AuthError } from 'next-auth';
import {
  fetchExpensesByDate,
  updateExpenseById,
  fetchExpensesForSelectedMonth,
  type FetchExpensesForSelectedMonthParams,
} from '@/app/lib/data';

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

type EditExpenseInput = {
  name: string;
  category: string;
  amount: number;
  expense_date: Date;
};

export async function editExpense(expenseId: number, data: EditExpenseInput) {
  'use server';
  try {
    await updateExpenseById(expenseId, data);
  } catch (error) {
    console.error('Failed to edit expense:', error);
    throw new Error('Failed to edit expense.');
  }
}

export async function getExpensesForMonth(params: FetchExpensesForSelectedMonthParams) {
  'use server';
  return await fetchExpensesForSelectedMonth(params);
}
