'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, MoreHorizontal, TrendingUp } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardDescription, CardTitle, CardAction, CardFooter } from '@/components/ui/card';

export type ExpenseItem = {
  id: string;
  name: string;
  category: string;
  amount: number;
};

export type Expense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  vendor?: string;
  items?: ExpenseItem[];
};

const data: Expense[] = [
  {
    id: '1',
    name: 'Pingo Doce',
    vendor: 'Pingo Doce',
    category: 'Food',
    amount: 15050, // 150.50 EUR in cents
    items: [
      { id: '1-1', name: 'Milk Milk Milk Milk Milk Milk Milk', category: 'Food', amount: 250 },
      { id: '1-2', name: 'Bread', category: 'Food', amount: 120 },
      { id: '1-3', name: 'Eggs', category: 'Food', amount: 300 },
    ],
  },
  {
    id: '2',
    name: 'Gas',
    category: 'Transportation',
    amount: 4500, // 45.00 EUR in cents
  },
  {
    id: '3',
    name: 'Netflix',
    category: 'Entertainment',
    amount: 1599, // 15.99 EUR in cents
  },
  {
    id: '4',
    name: 'Rent',
    category: 'Housing',
    amount: 120000, // 1200.00 EUR in cents
  },
  {
    id: '5',
    name: 'Continente',
    vendor: 'Continente',
    category: 'Food',
    amount: 8750, // 87.50 EUR in cents
    items: [
      { id: '5-1', name: 'Chicken', category: 'Food', amount: 1200 },
      { id: '5-2', name: 'Rice', category: 'Food', amount: 350 },
      { id: '5-3', name: 'Vegetables', category: 'Food', amount: 6200 },
    ],
  },
];

const columns: ColumnDef<Expense>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      const hasItems = row.original.items && row.original.items.length > 0;
      if (!hasItems) return null;
      return (
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => row.toggleExpanded()}>
          {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      );
    },
    enableHiding: false,
  },
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
      const expense = row.original;
      // Use vendor if available, otherwise use name
      const displayName = expense.vendor || expense.name;
      return <div className={expense.items ? 'font-medium' : ''}>{displayName}</div>;
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.getValue('category')}
      </Badge>
    ),
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amountInCents = parseFloat(row.getValue('amount'));
      const amountInEuros = amountInCents / 100;
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(amountInEuros);
      return <div className="text-right font-medium">{formatted}</div>;
    },
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(expense.id)}>
              Copy expense ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit expense</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function StatsCards() {
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Spent Today</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">$1,250.00</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="size-4" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Visitors for the last 6 months</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Spent This Month</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">$1,250.00</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="size-4" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Visitors for the last 6 months</div>
        </CardFooter>
      </Card>
      <Card className="@container/card" />
      <Card className="@container/card" />
    </div>
  );
}

function DataTable() {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
  });
  const [expanded, setExpanded] = React.useState<ExpandedState>(() => {
    // Default to expanded for all rows that have items
    const expandedState: ExpandedState = {};
    data.forEach((expense, index) => {
      if (expense.items && expense.items.length > 0) {
        expandedState[index] = true;
      }
    });
    return expandedState;
  });

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    state: {
      columnFilters,
      columnVisibility,
      expanded,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={event => table.getColumn('name')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
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
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
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
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsExpanded() && 'expanded'}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && row.original.items && row.original.items.length > 0 && (
                    <>
                      {row.original.items.map(item => (
                        <TableRow key={item.id} className="bg-muted/50">
                          {row.getVisibleCells().map((cell, cellIndex) => {
                            const columnId = cell.column.id;

                            // Handle each column type
                            if (columnId === 'expander' || columnId === 'id' || columnId === 'actions') {
                              return <TableCell key={cell.id} />;
                            }

                            if (columnId === 'name') {
                              return (
                                <TableCell key={cell.id} className="pl-6">
                                  {item.name}
                                </TableCell>
                              );
                            }

                            if (columnId === 'category') {
                              return (
                                <TableCell key={cell.id}>
                                  <Badge variant="outline" className="text-muted-foreground px-1.5">
                                    {item.category}
                                  </Badge>
                                </TableCell>
                              );
                            }

                            if (columnId === 'amount') {
                              const formatted = new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(item.amount / 100);
                              return (
                                <TableCell key={cell.id} className="text-right font-medium">
                                  {formatted}
                                </TableCell>
                              );
                            }

                            return <TableCell key={cell.id} />;
                          })}
                        </TableRow>
                      ))}
                    </>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
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
  );
}

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <StatsCards />
      <DataTable />
    </div>
  );
}
