export interface IExpense {
  id: number;
  name: string;
  category: string | null;
  amount: number;
  receipt_id: number | null;
  expense_date: string;
  created_at: string;
}

export interface IReceipt {
  id: number;
  receipt_date: string;
  vendor: string | null;
  total_amount: number | null;
  created_at: string;
}

export type VendorT = '1' | '2';