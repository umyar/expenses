'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';

import { categoriesDictionary } from '@/app/lib/constants';
import { Button } from '@/components/ui/button';
import { IExpense } from '@/app/types';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getExpensesByDay, editExpense } from '@/app/lib/actions';
import { DrawerDialog } from '@/components/drawer-dialog';
import { EditForm } from '@/components/expenses/edit-form';
import { format } from 'date-fns';
import { DateSelector } from './date-selector';

const createColumns = (handleOpenEdit: (expense: IExpense) => void): ColumnDef<IExpense>[] => [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <div>{row.getValue('id')}</div>,
    enableHiding: true,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      return <div>{row.getValue('name')}</div>;
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.getValue('category') as string | null;
      if (!category) {
        return <div>N/A</div>;
      }
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {categoriesDictionary[category]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      const sortDirection = column.getIsSorted();
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              Amount
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : sortDirection === 'desc' ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUpDown className="h-4 w-4" />
              )}
            </div>
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amountInCents = parseFloat(row.getValue('amount'));
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
      const expense = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(expense.expense_id))}>
              Copy expense ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenEdit(expense)}>Edit expense</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function DataTable({ selectedDay }: { selectedDay: Date }) {
  const [data, setData] = React.useState<IExpense[]>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
  });
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<IExpense | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadExpenses = React.useCallback(async () => {
    try {
      const expenses = await getExpensesByDay(selectedDay);
      setData(expenses);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  }, [selectedDay]);

  React.useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleOpenEdit = React.useCallback((expense: IExpense) => {
    setSelectedExpense(expense);
    setIsEditOpen(true);
  }, []);

  const columns = React.useMemo(() => createColumns(handleOpenEdit), [handleOpenEdit]);

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 100,
      },
    },
    state: {
      columnFilters,
      sorting,
      columnVisibility,
    },
  });

  const handleEditSubmit = React.useCallback(
    async (formData: { name: string; category: string; amount: number; expense_date: Date }) => {
      if (!selectedExpense) {
        return;
      }

      setIsSaving(true);
      try {
        await editExpense(selectedExpense.expense_id, formData);
        await loadExpenses();
        setIsEditOpen(false);
        setSelectedExpense(null);
      } catch (error) {
        console.error('Failed to edit expense:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [loadExpenses, selectedExpense],
  );

  return (
    <>
      <div className="w-full">
        <div className="flex flex-wrap items-center py-4 gap-5">
          <DateSelector defaultDate={format(selectedDay, 'dd-MM-yyyy')} />
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="Filter by name..."
              value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
              onChange={event => table.getColumn('name')?.setFilterValue(event.target.value)}
              className="w-full max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={value => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableHead key={header.id} className={header.column.id === 'amount' ? 'text-right' : ''}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className={cell.column.id === 'amount' ? 'pr-[26px]' : ''}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
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
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
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
            setSelectedExpense(null);
          }
        }}
        title="Edit expense"
        description={selectedExpense ? `Update expense #${selectedExpense.expense_id}` : undefined}
        dialogContentClassName="sm:max-w-lg"
        drawerContentClassName="p-[32px] pt-0"
      >
        {selectedExpense && (
          <div className="py-4">
            <EditForm
              defaultValues={{
                name: selectedExpense.name,
                category: selectedExpense.category ?? undefined,
                amount: selectedExpense.amount,
                expense_date: selectedExpense.expense_date,
              }}
              onSubmit={handleEditSubmit}
              isSubmitting={isSaving}
            />
          </div>
        )}
      </DrawerDialog>
    </>
  );
}

export function DataTableSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <div className="h-10 w-64 rounded-md bg-muted animate-pulse" />
        <div className="ml-auto h-10 w-24 rounded-md bg-muted animate-pulse" />
      </div>
      <div className="overflow-hidden rounded-md border">
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
