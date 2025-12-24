import postgres from 'postgres';

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
      SELECT * FROM expenses 
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
  category?: string;
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
            `SELECT * FROM expenses 
             WHERE EXTRACT(YEAR FROM expense_date) = ${year}
               AND EXTRACT(MONTH FROM expense_date) = ${month}
               AND category = '${category.replace(/'/g, "''")}'
             ORDER BY ${orderBy}
             LIMIT ${pageSize}
             OFFSET ${offset}`
          )
        : sql.unsafe<any>(
            `SELECT * FROM expenses 
             WHERE EXTRACT(YEAR FROM expense_date) = ${year}
               AND EXTRACT(MONTH FROM expense_date) = ${month}
             ORDER BY ${orderBy}
             LIMIT ${pageSize}
             OFFSET ${offset}`
          ),
      category
        ? sql<[{ count: string }]>`
            SELECT COUNT(*) as count FROM expenses 
            WHERE EXTRACT(YEAR FROM expense_date) = ${year}
              AND EXTRACT(MONTH FROM expense_date) = ${month}
              AND category = ${category}
          `
        : sql<[{ count: string }]>`
            SELECT COUNT(*) as count FROM expenses 
            WHERE EXTRACT(YEAR FROM expense_date) = ${year}
              AND EXTRACT(MONTH FROM expense_date) = ${month}
          `
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
      FROM expenses 
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
      FROM expenses 
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
  category: string;
  total: number;
};

export async function fetchMonthlyTotalsByCategories(year: number, month: number) {
  try {
    return await sql<MonthlyCategoryTotalT[]>`
      SELECT
        EXTRACT(YEAR FROM expense_date)::INTEGER AS year,
        EXTRACT(MONTH FROM expense_date)::INTEGER AS month,
        COALESCE(category, 'other') AS category,
        SUM(amount)::INTEGER AS total
      FROM expenses
      WHERE EXTRACT(YEAR FROM expense_date) = ${year}
        AND EXTRACT(MONTH FROM expense_date) = ${month}
      GROUP BY
        EXTRACT(YEAR FROM expense_date),
        EXTRACT(MONTH FROM expense_date),
        COALESCE(category, 'other')
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
          COALESCE(category, 'other') AS category,
          SUM(amount)::INTEGER AS total
        FROM expenses
        GROUP BY
         EXTRACT(YEAR FROM expense_date),
         EXTRACT(MONTH FROM expense_date),
         COALESCE(category, 'other')
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
          COALESCE(category, 'other') AS category,
          SUM(amount)::INTEGER AS total
        FROM expenses
        WHERE expense_date >= ${startDate}::date
          AND expense_date < (${endDate}::date + interval '1 month')
        GROUP BY
          EXTRACT(YEAR FROM expense_date),
          EXTRACT(MONTH FROM expense_date),
          COALESCE(category, 'other')
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
  category: string;
  amount: number;
  expense_date: Date;
};

export async function updateExpenseById(id: number, data: ExpenseUpdateInput) {
  try {
    const [updatedExpense] = await sql<any>`
      UPDATE expenses
      SET name = ${data.name},
          category = ${data.category},
          amount = ${data.amount},
          expense_date = DATE(${data.expense_date})
      WHERE id = ${id}
      RETURNING *
    `;

    return updatedExpense;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update expense.');
  }
}
