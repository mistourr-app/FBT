// server.js

const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const port = process.env.PORT || 8080;

// --- Middleware ---
app.use(cors());
app.use(express.json());
// Serve static files like index.html and categories.html from the root directory
app.use(express.static(path.join(__dirname, '')));


// --- In-Memory "Database" ---
let incomeCategories = ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'];
let expenseCategories = ['Food', 'Housing', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Other'];

let transactions = [
    // Example data for the previous month
    { id: 1, type: 'income', amount: 2500, category: 'Salary', date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString() },
    { id: 2, type: 'expense', amount: 150, category: 'Food', date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString() },
    // Example data for the current month
    { id: 3, type: 'income', amount: 2500, category: 'Salary', date: new Date().toISOString() },
    { id: 4, type: 'expense', amount: 900, category: 'Housing', date: new Date().toISOString() },
    { id: 5, type: 'expense', amount: 75, category: 'Transport', date: new Date().toISOString() },
];
let nextId = 6;

// --- API Endpoints ---

// GET /transactions - Read all transactions
app.get('/transactions', (req, res) => {
    const { year, month } = req.query;
    let filteredTransactions = transactions;

    if (year && month) {
        console.log(`Filtering transactions for ${year}-${month}`);
        const numYear = parseInt(year, 10);
        const numMonth = parseInt(month, 10); // 1-12

        filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getFullYear() === numYear && (transactionDate.getMonth() + 1) === numMonth;
        });
    }
    res.json(filteredTransactions);
});

// POST /transactions - Create a new transaction (income or expense)
app.post('/transactions', (req, res) => {
    const { type, amount, category, date } = req.body;

    // Basic validation
    if (!type || !amount || !category || !date || (type !== 'income' && type !== 'expense')) {
        return res.status(400).json({ error: 'Invalid data provided' });
    }

    const newTransaction = {
        id: nextId++,
        type,
        amount: parseFloat(amount), // Ensure amount is a number
        category,
        date,
    };

    transactions.push(newTransaction);
    console.log(`POST /transactions - Added ${type}: ${amount} in category ${category} on ${date}`);
    res.status(201).json(newTransaction);
});

// DELETE /transactions/:id - Delete a transaction
app.delete('/transactions/:id', (req, res) => {
    const idToDelete = parseInt(req.params.id, 10);
    const initialLength = transactions.length;
    transactions = transactions.filter(t => t.id !== idToDelete);

    if (transactions.length < initialLength) {
        console.log(`DELETE /transactions/${idToDelete} - Success`);
        res.status(204).send(); // Success, no content
    } else {
        console.log(`DELETE /transactions/${idToDelete} - ID not found`);
        res.status(404).json({ error: 'Transaction not found' });
    }
});

// --- Category API Endpoints ---

// GET /categories - Read all categories
app.get('/categories', (req, res) => {
    res.json({
        income: incomeCategories,
        expenses: expenseCategories,
    });
});

// POST /categories - Add a new category
app.post('/categories', (req, res) => {
    const { type, name } = req.body;
    if (type === 'income') {
        incomeCategories.push(name);
    } else if (type === 'expense') {
        expenseCategories.push(name);
    } else {
        return res.status(400).json({ error: 'Invalid category type' });
    }
    console.log(`POST /categories - Added ${type} category: "${name}"`);
    res.status(201).json({ success: true });
});

// PUT /categories - Rename a category
app.put('/categories', (req, res) => {
    const { type, oldName, newName } = req.body;
    let categoryList = type === 'income' ? incomeCategories : expenseCategories;
    const index = categoryList.indexOf(oldName);

    if (index !== -1) {
        categoryList[index] = newName;
        // Update existing transactions
        transactions.forEach(t => {
            if (t.type === type && t.category === oldName) {
                t.category = newName;
            }
        });
        console.log(`PUT /categories - Renamed ${type} category from "${oldName}" to "${newName}"`);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Category not found' });
    }
});

// DELETE /categories - Delete a category
app.delete('/categories', (req, res) => {
    const { type, name } = req.body;

    // Prevent deletion if category is in use
    const isUsed = transactions.some(t => t.type === type && t.category === name);
    if (isUsed) {
        return res.status(400).json({ error: `Category "${name}" is in use and cannot be deleted.` });
    }

    if (type === 'income') {
        incomeCategories = incomeCategories.filter(c => c !== name);
    } else if (type === 'expense') {
        expenseCategories = expenseCategories.filter(c => c !== name);
    } else {
        return res.status(400).json({ error: 'Invalid category type' });
    }
    console.log(`DELETE /categories - Deleted ${type} category: "${name}"`);
    res.status(204).send();
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Budget tracker server running on http://localhost:${port}`);
});
