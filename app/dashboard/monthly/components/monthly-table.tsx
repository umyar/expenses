'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';

import { IExpense } from '@/app/types';
import { categoriesDictionary } from '@/app/lib/constants';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getExpensesForMonth, editExpense } from '@/app/lib/actions';
import { DrawerDialog } from '@/components/drawer-dialog';
import { EditForm } from '@/components/expenses/edit-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useIsMobile } from '@/hooks/use-mobile';
import { Label } from '@/components/ui/label';

const pageSize = 15;

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
    accessorKey: 'expense_date',
    header: ({ column }) => {
      const sortDirection = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            Date
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
      const date = new Date(row.getValue('expense_date'));
      return <div>{format(date, 'MMMM d')}</div>;
    },
    enableSorting: true,
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(expense.id))}>
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

interface MonthlyTableProps {
  year: number;
  month: number;
}

export function MonthlyTable({ year, month }: MonthlyTableProps) {
  const [data, setData] = React.useState<IExpense[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'amount', desc: true }]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
  });
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<IExpense | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [categoryFilter, setCategoryFilter] = React.useState<string | undefined>(undefined);

  const isMobile = useIsMobile();

  const loadExpenses = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const sortBy = sorting[0]?.id || 'amount';
      const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
      const result = await getExpensesForMonth({
        year,
        month,
        page,
        pageSize,
        category: categoryFilter,
        sortBy,
        sortOrder,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [year, month, page, pageSize, categoryFilter, sorting]);

  React.useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Reset to page 1 when year, month, category, or sorting changes
  React.useEffect(() => {
    setPage(1);
  }, [year, month, categoryFilter, sorting]);

  const handleOpenEdit = React.useCallback((expense: IExpense) => {
    setSelectedExpense(expense);
    setIsEditOpen(true);
  }, []);

  const columns = React.useMemo(() => createColumns(handleOpenEdit), [handleOpenEdit]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(total / pageSize),
    initialState: {
      pagination: {
        pageSize,
      },
      sorting: [{ id: 'amount', desc: true }],
    },
    state: {
      sorting,
      columnVisibility,
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
  });

  const handleEditSubmit = React.useCallback(
    async (formData: { name: string; category: string; amount: number; expense_date: Date }) => {
      if (!selectedExpense) {
        return;
      }

      setIsSaving(true);
      try {
        await editExpense(selectedExpense.id, formData);
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

  const categoryFilterValue = categoryFilter ?? 'all';
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...Object.entries(categoriesDictionary).map(([key, label]) => ({ value: key, label })),
  ];

  const handleCategoryFilterChange = React.useCallback((value: string) => {
    setCategoryFilter(value === 'all' ? undefined : value);
  }, []);

  return (
    <>
      <div className="w-full">
        <div className="flex flex-wrap items-center py-4 gap-5">
          <div className="min-w-[200px] flex-1 flex items-center gap-2">
            <Label htmlFor="category-select">Category:</Label>
            {isMobile ? (
              <NativeSelect
                id="category-select"
                value={categoryFilterValue}
                onChange={e => {
                  handleCategoryFilterChange(e.target.value);
                }}
              >
                {categoryOptions.map(option => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            ) : (
              <Select value={categoryFilterValue} onValueChange={handleCategoryFilterChange}>
                <SelectTrigger id="category-select" className="w-[200px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                      const cellClassName =
                        cell.column.id === 'amount'
                          ? 'pr-[26px]'
                          : cell.column.id === 'expense_date'
                            ? 'pl-[26px]'
                            : '';
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
            setSelectedExpense(null);
          }
        }}
        title="Edit expense"
        description={selectedExpense ? `Update expense #${selectedExpense.id}` : undefined}
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
