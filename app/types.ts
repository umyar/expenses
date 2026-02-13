export interface IExpense {
  expense_id: number;
  name: string;
  category_id: number;
  amount: number;
  receipt_id: number | null;
  expense_date: string;
  created_at: string;
}

export interface IReceipt {
  receipt_id: number;
  receipt_date: string;
  vendor: VendorT;
  amount: number | null;
  created_at: string;
}

export type VendorT = '1' | '2' | '3';
