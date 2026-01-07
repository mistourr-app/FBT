// --- Default Data ---
// This data will be used to initialize the database if it's empty.
const initialData = {
    transactions: [
        // --- Current Month Data ---
        { id: 1, type: 'income', amount: 3200, category: 'Salary', date: new Date().toISOString() },
        { id: 2, type: 'expense', amount: 1100, category: 'Housing', date: new Date().toISOString() },
        { id: 3, type: 'expense', amount: 85, category: 'Transport', date: new Date().toISOString() },
        { id: 4, type: 'expense', amount: 45, category: 'Health', date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString() },

        // --- 2025 Data ---
        { id: 5, type: 'income', amount: 3100, category: 'Salary', date: new Date('2025-01-05').toISOString() },
        { id: 6, type: 'expense', amount: 180, category: 'Food', date: new Date('2025-01-15').toISOString() },
        { id: 7, type: 'income', amount: 3100, category: 'Salary', date: new Date('2025-02-05').toISOString() },
        { id: 8, type: 'expense', amount: 220, category: 'Entertainment', date: new Date('2025-02-20').toISOString() },

        // --- 2024 Data ---
        { id: 9, type: 'income', amount: 3000, category: 'Salary', date: new Date('2024-01-05').toISOString() },
        { id: 10, type: 'expense', amount: 800, category: 'Housing', date: new Date('2024-01-10').toISOString() },
        { id: 11, type: 'income', amount: 3000, category: 'Salary', date: new Date('2024-02-05').toISOString() },
        { id: 12, type: 'expense', amount: 120, category: 'Utilities', date: new Date('2024-02-12').toISOString() },
        { id: 13, type: 'income', amount: 3000, category: 'Salary', date: new Date('2024-03-05').toISOString() },
        { id: 14, type: 'expense', amount: 250, category: 'Entertainment', date: new Date('2024-03-20').toISOString() },
        { id: 15, type: 'income', amount: 500, category: 'Freelance', date: new Date('2024-03-25').toISOString() },
    ],
    incomeCategories: ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'],
    expenseCategories: ['Food', 'Housing', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Other'],
    nextId: 16
};

// --- Database Initialization ---
function initializeDB() {
    if (!localStorage.getItem('budget-tracker-db')) {
        console.log('Initializing database with default data...');
        localStorage.setItem('budget-tracker-db', JSON.stringify(initialData));
    }
}

function getDB() {
    return JSON.parse(localStorage.getItem('budget-tracker-db'));
}

function saveDB(db) {
    localStorage.setItem('budget-tracker-db', JSON.stringify(db));
}

// --- API-like Functions (these replace the server endpoints) ---

const db = {
    getTransactions: (year, month) => {
        const data = getDB();
        let filtered = data.transactions;

        if (year) {
            const numYear = parseInt(year, 10);
            filtered = filtered.filter(t => new Date(t.date).getFullYear() === numYear);

            if (month && !isNaN(parseInt(month, 10))) {
                const numMonth = parseInt(month, 10);
                filtered = filtered.filter(t => (new Date(t.date).getMonth() + 1) === numMonth);
            }
        }
        return filtered;
    },

    addTransaction: (transaction) => {
        const data = getDB();
        const newTransaction = {
            ...transaction,
            id: data.nextId++,
            amount: parseFloat(transaction.amount)
        };
        data.transactions.push(newTransaction);
        saveDB(data);
        return newTransaction;
    },

    deleteTransaction: (id) => {
        const data = getDB();
        const initialLength = data.transactions.length;
        data.transactions = data.transactions.filter(t => t.id !== id);
        if (data.transactions.length < initialLength) {
            saveDB(data);
            return true;
        }
        return false;
    },

    getAvailableDates: () => {
        const data = getDB();
        const datesWithData = {};
        data.transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            const year = transactionDate.getFullYear();
            const month = transactionDate.getMonth() + 1;
            if (!datesWithData[year]) {
                datesWithData[year] = new Set();
            }
            datesWithData[year].add(month);
        });
        for (const year in datesWithData) {
            datesWithData[year] = Array.from(datesWithData[year]).sort((a, b) => a - b);
        }
        return datesWithData;
    },

    getCategories: () => {
        const data = getDB();
        return {
            income: data.incomeCategories,
            expenses: data.expenseCategories
        };
    }
    // Note: Category management (add, rename, delete) would require more functions here.
    // For now, we'll just read them.
};

// Initialize the database on script load
initializeDB();