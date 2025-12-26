'use client';

import * as React from 'react';
import { IExpense } from '@/app/types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

interface ReceiptExpensesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: number | null;
  expenses: IExpense[];
  isLoading: boolean;
}

export function ReceiptExpensesDrawer({
  open,
  onOpenChange,
  receiptId,
  expenses,
  isLoading,
}: ReceiptExpensesDrawerProps) {
  const expensesTotalCents = (expenses || []).reduce((expsSum, currExp) => {
    return expsSum + currExp.amount;
  }, 0);

  const expensesTotalEur = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(expensesTotalCents / 100);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-sm h-full flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle className="text-sm">Receipt Expenses</DrawerTitle>
          <DrawerDescription className="text-xs">
            {receiptId ? `Expenses for receipt #${receiptId}` : 'Expenses'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          {isLoading ? (
            <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">No expenses found</div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end items-center py-2 border-b gap-1.5">
                <div className="font-normal text-sm">Total:</div>
                <div className="text-right font-semibold">{expensesTotalEur}</div>
              </div>
              {expenses.map(expense => {
                const amountInEuros = expense.amount / 100;
                const formatted = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(amountInEuros);
                return (
                  <div
                    key={expense.id}
                    className="flex justify-between items-center py-2 border-b last:border-0 text-sm gap-2"
                  >
                    <div className="font-normal">{expense.name}</div>
                    <div className="text-right font-semibold">{formatted}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
