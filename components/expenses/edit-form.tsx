'use client';

import * as React from 'react';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/date-picker';
import { categoriesDictionary } from '@/app/lib/constants';
import { Button } from '@/components/ui/button';

interface EditFormProps {
  defaultValues?: {
    name?: string;
    category?: string;
    amount?: number; // amount in cents
    expense_date?: Date | string;
  };
  onSubmit?: (data: {
    name: string;
    category: string;
    amount: number; // amount in cents
    expense_date: Date;
  }) => Promise<void> | void;
  className?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function EditForm({
  defaultValues,
  onSubmit,
  className,
  submitLabel = 'Save changes',
  isSubmitting = false,
}: EditFormProps) {
  const [name, setName] = React.useState(defaultValues?.name || '');
  const [category, setCategory] = React.useState<string | undefined>(
    defaultValues?.category
  );
  const [amount, setAmount] = React.useState(
    defaultValues?.amount ? (defaultValues.amount / 100).toFixed(2) : ''
  );
  const [expenseDate, setExpenseDate] = React.useState<Date | undefined>(
    defaultValues?.expense_date
      ? typeof defaultValues.expense_date === 'string'
        ? new Date(defaultValues.expense_date)
        : defaultValues.expense_date
      : undefined
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onSubmit) return;

    const parsedAmount = parseFloat(amount || '0');
    if (Number.isNaN(parsedAmount)) {
      return;
    }

    const amountInCents = Math.round(parsedAmount * 100);
    const selectedDate = expenseDate || new Date();

    await onSubmit({
      name,
      category: category || 'other',
      amount: amountInCents,
      expense_date: selectedDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter expense name"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="category">Category</FieldLabel>
          <Select value={category || undefined} onValueChange={setCategory}>
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoriesDictionary).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="amount">Amount (EUR)</FieldLabel>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </Field>

        <Field>
          <DatePicker
            id="expense_date"
            label="Expense Date"
            value={expenseDate}
            onValueChange={setExpenseDate}
            placeholder="Select expense date"
            required
          />
        </Field>

        <Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

