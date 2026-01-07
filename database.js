// --- Default Data ---
// This data will be used to initialize the database if it's empty.
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();
const initialData = {
    transactions: [
        // --- Current Month Data ---
        { id: 1, type: 'income', amount: 3200, category: 'Salary', date: new Date(currentYear, currentMonth, 5).toISOString() },
        { id: 2, type: 'expense', amount: 1100, category: 'Housing', date: new Date(currentYear, currentMonth, 1).toISOString() },
        { id: 3, type: 'expense', amount: 85, category: 'Transport', date: new Date(currentYear, currentMonth, 8).toISOString() },
        { id: 4, type: 'expense', amount: 45, category: 'Health', date: new Date(currentYear, currentMonth, 3).toISOString() },

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
    try {
        localStorage.setItem('budget-tracker-db', JSON.stringify(db));
    } catch (error) {
        console.error("Failed to save database to localStorage:", error);
    }
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
        const indexToDelete = data.transactions.findIndex(t => t.id === id);

        if (indexToDelete > -1) {
            data.transactions.splice(indexToDelete, 1); // Remove the item by index
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
    },

    addCategory: (type, name) => {
        const data = getDB();
        const categoryArray = type === 'income' ? data.incomeCategories : data.expenseCategories;
        if (categoryArray.includes(name)) {
            throw new Error(`Category "${name}" already exists.`);
        }
        categoryArray.push(name);
        saveDB(data);
        return true;
    },

    deleteCategory: (type, name) => {
        const data = getDB();
        // Check if the category is in use by any transaction
        const isUsed = data.transactions.some(t => t.category === name && t.type === type);
        if (isUsed) {
            throw new Error(`Cannot delete category "${name}" because it is currently in use by one or more transactions.`);
        }

        const categoryArray = type === 'income' ? data.incomeCategories : data.expenseCategories;
        const indexToDelete = categoryArray.indexOf(name);

        if (indexToDelete > -1) {
            categoryArray.splice(indexToDelete, 1);
            saveDB(data);
            return true;
        }
        return false;
    },

    renameCategory: (type, oldName, newName) => {
        const data = getDB();
        const categoryArray = type === 'income' ? data.incomeCategories : data.expenseCategories;

        // Check if the new name already exists
        if (categoryArray.includes(newName)) {
            throw new Error(`Category "${newName}" already exists.`);
        }

        const indexToRename = categoryArray.indexOf(oldName);
        if (indexToRename > -1) {
            // Rename in category list
            categoryArray[indexToRename] = newName;

            // Update all transactions using the old category name
            data.transactions.forEach(t => {
                if (t.category === oldName && t.type === type) {
                    t.category = newName;
                }
            });
            saveDB(data);
            return true;
        }
        return false;
    }
};

// Initialize the database on script load
initializeDB();