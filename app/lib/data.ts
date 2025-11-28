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
