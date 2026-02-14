import postgres from 'postgres';

import { auth } from '@/auth';
import { IReceipt } from '@/app/types';

const getUserId = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return userId;
};

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function fetchUsers() {
  try {
    const data = await sql<any>`SELECT * FROM users`;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch users data.');
  }
}

export async function fetchExpensesByDate(date: Date) {
  try {
    const data = await sql<any>`
      SELECT expense_id, name, category_id, amount, expense_date FROM expense
      WHERE expense_date = DATE(${date})
      ORDER BY created_at DESC
    `;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch expenses data.');
  }
}

export type FetchExpensesForSelectedMonthParams = {
  year: number;
  month: number;
  page?: number;
  pageSize?: number;
  category?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export async function fetchExpensesForSelectedMonth({
  year,
  month,
  page = 1,
  pageSize = 15,
  category,
  sortBy = 'amount',
  sortOrder = 'desc',
}: FetchExpensesForSelectedMonthParams) {
  try {
    const offset = (page - 1) * pageSize;

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['amount', 'expense_date', 'created_at', 'name', 'category'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'amount';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Build ORDER BY clause - column name is safe because it's validated against whitelist
    const orderBy = `${safeSortBy} ${safeSortOrder}`;

    // Use sql.unsafe with proper parameterization for values, validated column name in ORDER BY
    const [data, countResult] = await Promise.all([
      category
        ? sql.unsafe<any>(
            `SELECT expense_id, name, category_id, amount, expense_date FROM expense 
             WHERE EXTRACT(YEAR FROM expense_date) = ${year}
               AND EXTRACT(MONTH FROM expense_date) = ${month}
               AND category_id = ${category}
             ORDER BY ${orderBy}
             LIMIT ${pageSize}
             OFFSET ${offset}`,
          )
        : sql.unsafe<any>(
            `SELECT expense_id, name, category_id, amount, expense_date FROM expense 
             WHERE EXTRACT(YEAR FROM expense_date) = ${year}
               AND EXTRACT(MONTH FROM expense_date) = ${month}
             ORDER BY ${orderBy}
             LIMIT ${pageSize}
             OFFSET ${offset}`,
          ),
      category
        ? sql<[{ count: string }]>`
            SELECT COUNT(*) as count FROM expense
            WHERE EXTRACT(YEAR FROM expense_date) = ${year}
              AND EXTRACT(MONTH FROM expense_date) = ${month}
              AND category_id = ${category}
          `
        : sql<[{ count: string }]>`
            SELECT COUNT(*) as count FROM expense
            WHERE EXTRACT(YEAR FROM expense_date) = ${year}
              AND EXTRACT(MONTH FROM expense_date) = ${month}
          `,
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      total,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch expenses for selected month.');
  }
}

export async function fetchTodaySpent(date: Date) {
  try {
    const result = await sql<[{ sum: number | null }]>`
      SELECT COALESCE(SUM(amount), 0) as sum
      FROM expense
      WHERE expense_date = DATE(${date})
    `;

    return result[0]?.sum ?? 0;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch today spent amount.');
  }
}

export async function fetchMonthSpent(year: number, month: number) {
  try {
    const result = await sql<[{ sum: number | null }]>`
      SELECT COALESCE(SUM(amount), 0) as sum
      FROM expense
      WHERE EXTRACT(YEAR FROM expense_date) = ${year}
        AND EXTRACT(MONTH FROM expense_date) = ${month}
    `;

    return result[0]?.sum ?? 0;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch month spent amount.');
  }
}

export type MonthlyCategoryTotalT = {
  year: number;
  month: number;
  category: number;
  total: number;
};

export async function fetchMonthlyTotalsByCategories(year: number, month: number) {
  try {
    return await sql<MonthlyCategoryTotalT[]>`
      SELECT
        EXTRACT(YEAR FROM expense_date)::INTEGER AS year,
        EXTRACT(MONTH FROM expense_date)::INTEGER AS month,
        COALESCE(category_id, 6) AS category,
        SUM(amount)::INTEGER AS total
      FROM expense
      WHERE EXTRACT(YEAR FROM expense_date) = ${year}
        AND EXTRACT(MONTH FROM expense_date) = ${month}
      GROUP BY
        EXTRACT(YEAR FROM expense_date),
        EXTRACT(MONTH FROM expense_date),
        COALESCE(category_id, 6)
      ORDER BY category;
    `;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch monthly totals by categories.');
  }
}

export async function fetchNMonthsTotalsByCategories(lastNMonths: number) {
  try {
    if (lastNMonths === Infinity) {
      return await sql<MonthlyCategoryTotalT[]>`
        SELECT
          EXTRACT(YEAR FROM expense_date)::INTEGER AS year,
          EXTRACT(MONTH FROM expense_date)::INTEGER AS month,
          COALESCE(category_id, 6) AS category,
          SUM(amount)::INTEGER AS total
        FROM expense
        GROUP BY
         EXTRACT(YEAR FROM expense_date),
         EXTRACT(MONTH FROM expense_date),
         COALESCE(category_id, 6)
        ORDER BY year DESC, month DESC, category;
      `;
    } else {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const startDateObj = new Date(currentYear, currentMonth - lastNMonths, 1);
      const startYear = startDateObj.getFullYear();
      const startMonth = startDateObj.getMonth() + 1;

      const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

      return await sql<MonthlyCategoryTotalT[]>`
        SELECT
          EXTRACT(YEAR FROM expense_date)::INTEGER AS year,
          EXTRACT(MONTH FROM expense_date)::INTEGER AS month,
          COALESCE(category_id, 6) AS category,
          SUM(amount)::INTEGER AS total
        FROM expense
        WHERE expense_date >= ${startDate}::date
          AND expense_date < (${endDate}::date + interval '1 month')
        GROUP BY
          EXTRACT(YEAR FROM expense_date),
          EXTRACT(MONTH FROM expense_date),
          COALESCE(category_id, 6)
        ORDER BY year DESC, month DESC, category;
      `;
    }
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch monthly totals by categories.');
  }
}

type ExpenseUpdateInput = {
  name: string;
  category: number;
  amount: number;
  expense_date: Date;
};

export async function updateExpenseById(id: number, data: ExpenseUpdateInput) {
  try {
    const [updatedExpense] = await sql<any>`
      UPDATE expense
      SET name = ${data.name},
          category_id = ${data.category},
          amount = ${data.amount},
          expense_date = DATE(${data.expense_date})
      WHERE expense_id = ${id}
      RETURNING *
    `;

    return updatedExpense;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update expense.');
  }
}

export type FetchReceiptsParams = {
  page?: number;
  pageSize?: number;
  sortOrder?: 'asc' | 'desc';
};

export async function fetchReceipts({ page = 1, pageSize = 15, sortOrder = 'desc' }: FetchReceiptsParams = {}) {
  try {
    const offset = (page - 1) * pageSize;
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const [data, countResult] = await Promise.all([
      sql.unsafe<IReceipt[]>(
        `SELECT 
          receipt_id,
          receipt_date,
          vendor_id,
          amount
        FROM receipt
        ORDER BY receipt_date ${safeSortOrder}
        LIMIT ${pageSize}
        OFFSET ${offset}`,
      ),
      sql<[{ count: string }]>`
        SELECT COUNT(*) as count FROM receipt
      `,
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      total,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch receipts.');
  }
}

type ReceiptUpdateInput = {
  receipt_date: Date;
  amount: number | null;
};

export async function updateReceiptById(id: number, data: ReceiptUpdateInput) {
  try {
    const [updatedReceipt] = await sql<any>`
      UPDATE receipt
      SET receipt_date = DATE(${data.receipt_date}),
          amount = ${data.amount}
      WHERE receipt_id = ${id}
      RETURNING *
    `;

    return updatedReceipt;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update receipt.');
  }
}

export async function fetchExpensesByReceiptId(receiptId: number) {
  try {
    const data = await sql<any>`
      SELECT expense_id, name, amount
      FROM expense
      WHERE receipt_id = ${receiptId}
      ORDER BY created_at DESC
    `;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch expenses by receipt ID.');
  }
}
