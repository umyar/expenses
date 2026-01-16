'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ColumnDef, flexRender, getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil } from 'lucide-react';

import { VendorBadge } from '@/components/vendor-badge';
import { IReceipt, VendorT, IExpense } from '@/app/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getReceipts, editReceipt, getExpensesByReceiptId } from '@/app/lib/actions';
import { DrawerDialog } from '@/components/drawer-dialog';
import { EditReceipt } from './components/edit-receipt';
import { ISelectedReceiptData, ReceiptExpensesDrawer } from './components/receipt-expenses-drawer';

const pageSize = 15;

const createColumns = (
  handleOpenEdit: (receipt: IReceipt) => void,
  handleOpenExpenses: (receiptData: ISelectedReceiptData) => void,
): ColumnDef<IReceipt>[] => [
  {
    accessorKey: 'receipt_date',
    header: ({ column }) => {
      const sortDirection = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            Receipt Date
            {sortDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : sortDirection === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </div>
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('receipt_date'));
      const receipt = row.original;
      return (
        <button
          onClick={() => handleOpenExpenses({ id: receipt.receipt_id, vendor: receipt.vendor })}
          className="hover:underline cursor-pointer text-left"
        >
          {format(date, 'MMMM d, yyyy')}
        </button>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'vendor',
    header: 'Vendor',
    cell: ({ row }) => {
      const vendor = row.getValue('vendor') as VendorT;

      return (
        <div>
          <VendorBadge vendor={vendor} />
        </div>
      );
    },
  },
  {
    accessorKey: 'total_amount',
    header: () => {
      return <div className="text-right">Total Amount</div>;
    },
    cell: ({ row }) => {
      const amountInCents = row.getValue('total_amount') as number | null;
      if (amountInCents === null) {
        return <div className="text-right">N/A</div>;
      }
      const amountInEuros = amountInCents / 100;
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(amountInEuros);
      return <div className="text-right font-medium">{formatted}</div>;
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const receipt = row.original;
      return (
        <div className="flex justify-end">
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenEdit(receipt)}>
            <span className="sr-only">Edit receipt</span>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

export default function ReceiptsPage() {
  const [data, setData] = React.useState<IReceipt[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'receipt_date', desc: true }]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedReceipt, setSelectedReceipt] = React.useState<IReceipt | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isExpensesDrawerOpen, setIsExpensesDrawerOpen] = React.useState(false);
  const [selectedReceiptData, setSelectedReceiptData] = React.useState<ISelectedReceiptData | null>(null);
  const [expenses, setExpenses] = React.useState<IExpense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = React.useState(false);

  const loadReceipts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Only sort by receipt_date, get sort order from sorting state
      const receiptDateSort = sorting.find(s => s.id === 'receipt_date');
      const sortOrder = receiptDateSort?.desc ? 'desc' : 'asc';
      const result = await getReceipts({
        page,
        pageSize,
        sortOrder,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load receipts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, sorting]);

  React.useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  // Reset to page 1 when sorting changes
  React.useEffect(() => {
    setPage(1);
  }, [sorting]);

  const handleOpenEdit = React.useCallback((receipt: IReceipt) => {
    setSelectedReceipt(receipt);
    setIsEditOpen(true);
  }, []);

  const handleOpenExpenses = React.useCallback(async (receiptData: ISelectedReceiptData) => {
    setSelectedReceiptData(receiptData);
    setIsExpensesDrawerOpen(true);
    setIsLoadingExpenses(true);
    try {
      const expensesData = await getExpensesByReceiptId(receiptData.id);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      setExpenses([]);
    } finally {
      setIsLoadingExpenses(false);
    }
  }, []);

  const handleEditSubmit = React.useCallback(
    async (formData: { receipt_date: Date; amount: number | null }) => {
      if (!selectedReceipt) {
        return;
      }

      setIsSaving(true);
      try {
        await editReceipt(selectedReceipt.receipt_id, formData);
        await loadReceipts();
        setIsEditOpen(false);
        setSelectedReceipt(null);
      } catch (error) {
        console.error('Failed to edit receipt:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [loadReceipts, selectedReceipt],
  );

  const columns = React.useMemo(
    () => createColumns(handleOpenEdit, handleOpenExpenses),
    [handleOpenEdit, handleOpenExpenses],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(total / pageSize),
    initialState: {
      pagination: {
        pageSize,
      },
      sorting: [{ id: 'receipt_date', desc: true }],
    },
    state: {
      sorting,
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="w-full">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableHead key={header.id} className={header.column.id === 'total_amount' ? 'text-right' : ''}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => {
                      const cellClassName = cell.column.id === 'receipt_date' ? 'pl-[26px]' : '';
                      return (
                        <TableCell key={cell.id} className={cellClassName}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / pageSize) || 1}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPage = page - 1;
                if (newPage >= 1) {
                  setPage(newPage);
                }
              }}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPage = page + 1;
                if (newPage <= Math.ceil(total / pageSize)) {
                  setPage(newPage);
                }
              }}
              disabled={page >= Math.ceil(total / pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      <DrawerDialog
        open={isEditOpen}
        onOpenChange={open => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedReceipt(null);
          }
        }}
        title="Edit receipt"
        description={selectedReceipt ? `Update receipt #${selectedReceipt.receipt_id}` : undefined}
        dialogContentClassName="sm:max-w-lg"
        drawerContentClassName="p-[32px] pt-0"
      >
        {selectedReceipt && (
          <div className="py-4">
            <EditReceipt
              defaultValues={{
                receipt_date: selectedReceipt.receipt_date,
                amount: selectedReceipt.amount,
              }}
              onSubmit={handleEditSubmit}
              isSubmitting={isSaving}
            />
          </div>
        )}
      </DrawerDialog>

      <ReceiptExpensesDrawer
        open={isExpensesDrawerOpen}
        onOpenChange={setIsExpensesDrawerOpen}
        receiptData={selectedReceiptData}
        expenses={expenses}
        isLoading={isLoadingExpenses}
      />
    </div>
  );
}
