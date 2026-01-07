// server.js

const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const port = 8080;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- In-Memory "Database" ---
// Each transaction object will have a type: 'income' or 'expense'.
let transactions = [
    { id: 1, type: 'income', description: 'Paycheck', amount: 2000, category: 'Salary' },
    { id: 2, type: 'expense', description: 'Rent', amount: 800, category: 'Housing' },
    { id: 3, type: 'expense', description: 'Groceries', amount: 150, category: 'Food' },
];
let nextId = 4;

// --- API Endpoints ---

// GET / - Serve the frontend HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET /transactions - Read all transactions
app.get('/transactions', (req, res) => {
    console.log('GET /transactions - Sending all transactions');
    res.json(transactions);
});

// POST /transactions - Create a new transaction (income or expense)
app.post('/transactions', (req, res) => {
    const { type, description, amount, category } = req.body;

    // Basic validation
    if (!type || !description || !amount || !category || (type !== 'income' && type !== 'expense')) {
        return res.status(400).json({ error: 'Invalid data provided' });
    }

    const newTransaction = {
        id: nextId++,
        type,
        description,
        amount: parseFloat(amount), // Ensure amount is a number
        category,
    };

    transactions.push(newTransaction);
    console.log(`POST /transactions - Added ${type}: "${description}" for ${amount} in category ${category}`);
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


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Budget tracker server running on http://localhost:${port}`);
});
