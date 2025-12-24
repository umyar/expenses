export interface IExpense {
  id: number;
  name: string;
  category: string | null;
  amount: number;
  receipt_id: number | null;
  expense_date: string;
  created_at: string;
}
