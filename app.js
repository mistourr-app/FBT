document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const balanceEl = document.getElementById('balance');
    const transactionListEl = document.getElementById('transaction-list');
    const periodSelect = document.getElementById('period-select');
    const showAllContainer = document.getElementById('show-all-container');

    // Form elements
    const incomeForm = document.getElementById('income-form');
    const incomeAmountEl = document.getElementById('income-amount');
    const incomeCategoryEl = document.getElementById('income-category');
    const expenseForm = document.getElementById('expense-form');
    const expenseAmountEl = document.getElementById('expense-amount');
    const expenseCategoryEl = document.getElementById('expense-category');

    // --- State ---
    let selectedYear = null;
    let selectedMonth = null;

    // --- Formatters ---
    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const formatDate = (isoString) =>
        new Date(isoString).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    // --- Core Functions ---

    /**
     * Sets the selected date and triggers a UI refresh.
     * This function is passed as a callback to the period selector utility.
     */
    function setSelectedDate(year, month) {
        selectedYear = (year && year !== 'all') ? String(year) : null;
        selectedMonth = (month && month !== 'null') ? String(month) : null;

        // Store selection for navigation to the "All Transactions" page
        sessionStorage.setItem('selectedYear', selectedYear || '');
        sessionStorage.setItem('selectedMonth', selectedMonth || '');

        renderUI();
    }

    /**
     * Renders the entire UI based on the current state.
     */
    function renderUI() {
        updateSummary();
        renderLatestTransactions();
    }

    /**
     * Updates the summary cards (Income, Expenses, Balance).
     */
    function updateSummary() {
        const transactions = db.getTransactions(selectedYear, selectedMonth);
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expenses;

        totalIncomeEl.textContent = formatCurrency(income);
        totalExpensesEl.textContent = formatCurrency(expenses);
        balanceEl.textContent = formatCurrency(balance);

        // Style the balance
        balanceEl.classList.toggle('positive', balance >= 0);
        balanceEl.classList.toggle('negative', balance < 0);
    }

    /**
     * Renders the list of the 5 most recent transactions.
     */
    function renderLatestTransactions() {
        const transactions = db.getTransactions(selectedYear, selectedMonth);
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        const latest = transactions.slice(0, 6);

        transactionListEl.innerHTML = ''; // Clear list

        if (latest.length === 0) {
            transactionListEl.innerHTML = '<li class="mdc-list-item"><span class="mdc-list-item__text">No transactions for this period.</span></li>';
            showAllContainer.style.display = 'none';
            return;
        }

        showAllContainer.style.display = 'block';

        latest.forEach(t => {
            const li = document.createElement('li');
            li.className = `mdc-list-item ${t.type === 'income' ? 'income-item' : 'expense-item'}`;
            li.innerHTML = `
                <span class="mdc-list-item__text">
                    <span class="mdc-list-item__primary-text">${t.category}</span>
                    <span class="mdc-list-item__secondary-text">${formatDate(t.date)}</span>
                </span>
                <span class="mdc-list-item__meta amount">
                    <span class="amount-text">${t.type === 'expense' ? '-' : ''}${formatCurrency(t.amount)}</span>
                    <button class="mdc-icon-button material-icons delete-btn" data-id="${t.id}" title="Delete">delete</button>
                </span>
            `;
            transactionListEl.appendChild(li);
        });
    }

    /**
     * Populates the category dropdowns for the forms.
     */
    function populateCategoryDropdowns() {
        const { income, expenses } = db.getCategories();

        incomeCategoryEl.innerHTML = '<option value="" disabled selected>Select category</option>';
        income.forEach(cat => {
            incomeCategoryEl.add(new Option(cat, cat));
        });

        expenseCategoryEl.innerHTML = '<option value="" disabled selected>Select category</option>';
        expenses.forEach(cat => {
            expenseCategoryEl.add(new Option(cat, cat));
        });
    }

    /**
     * Handles the submission of transaction forms.
     */
    function handleAddTransaction(event, type) {
        event.preventDefault();
        const amountEl = type === 'income' ? incomeAmountEl : expenseAmountEl;
        const categoryEl = type === 'income' ? incomeCategoryEl : expenseCategoryEl;

        const transaction = {
            type: type,
            amount: parseFloat(amountEl.value),
            category: categoryEl.value,
            date: new Date().toISOString()
        };

        db.addTransaction(transaction);

        // Reset form and re-render
        event.target.reset();
        renderUI();
        // We need to repopulate the date filter in case a new month/year was added
        createPeriodSelector(periodSelect, setSelectedDate);
    }

    /**
     * Initializes the application.
     */
    function initializeApp() {
        // Initialize MDC Ripples
        document.querySelectorAll('.mdc-button').forEach(el => new mdc.ripple.MDCRipple(el));
        document.querySelectorAll('.mdc-icon-button').forEach(el => new mdc.ripple.MDCRipple(el));

        // Populate dynamic elements
        populateCategoryDropdowns();

        // Set up the period selector using the shared utility
        createPeriodSelector(periodSelect, setSelectedDate);

        // Set up event listeners for forms
        incomeForm.addEventListener('submit', (e) => handleAddTransaction(e, 'income'));
        expenseForm.addEventListener('submit', (e) => handleAddTransaction(e, 'expense'));

        // Event listener for deleting transactions (using event delegation)
        transactionListEl.addEventListener('click', (event) => {
            const deleteButton = event.target.closest('.delete-btn');
            if (deleteButton) {
                const id = deleteButton.dataset.id;
                if (confirm('Are you sure you want to delete this transaction?')) {
                    db.deleteTransaction(parseInt(id, 10));
                    renderUI();
                    // Repopulate date filter in case a month/year is now empty
                    createPeriodSelector(periodSelect, setSelectedDate);
                }
            }
        });

        // Initial render is triggered by createPeriodSelector
    }

    // --- Start the App ---
    initializeApp();
});