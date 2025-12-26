'use client';

import * as React from 'react';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/date-picker';
import { Button } from '@/components/ui/button';

interface EditReceiptProps {
  defaultValues?: {
    receipt_date?: Date | string;
    total_amount?: number | null; // amount in cents
  };
  onSubmit?: (data: {
    receipt_date: Date;
    total_amount: number | null; // amount in cents
  }) => Promise<void> | void;
  className?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function EditReceipt({
  defaultValues,
  onSubmit,
  className,
  submitLabel = 'Save changes',
  isSubmitting = false,
}: EditReceiptProps) {
  const [amount, setAmount] = React.useState(
    defaultValues?.total_amount !== null && defaultValues?.total_amount !== undefined
      ? (defaultValues.total_amount / 100).toFixed(2)
      : ''
  );
  const [receiptDate, setReceiptDate] = React.useState<Date | undefined>(
    defaultValues?.receipt_date
      ? typeof defaultValues.receipt_date === 'string'
        ? new Date(defaultValues.receipt_date)
        : defaultValues.receipt_date
      : undefined
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onSubmit) return;

    const parsedAmount = amount ? parseFloat(amount) : null;
    if (amount && Number.isNaN(parsedAmount!)) {
      return;
    }

    const amountInCents = parsedAmount !== null ? Math.round(parsedAmount * 100) : null;
    const selectedDate = receiptDate || new Date();

    await onSubmit({
      receipt_date: selectedDate,
      total_amount: amountInCents,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <FieldGroup>
        <Field>
          <DatePicker
            id="receipt_date"
            label="Receipt Date"
            value={receiptDate}
            onValueChange={setReceiptDate}
            placeholder="Select receipt date"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="amount">Total Amount (EUR)</FieldLabel>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
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

