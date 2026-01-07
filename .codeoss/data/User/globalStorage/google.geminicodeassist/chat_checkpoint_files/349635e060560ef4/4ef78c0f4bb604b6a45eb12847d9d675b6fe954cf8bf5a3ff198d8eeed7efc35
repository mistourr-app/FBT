const apiUrl = ''; // Use relative paths for API calls
const transactionList = document.getElementById('transaction-list');
const incomeForm = document.getElementById('income-form');
const expenseForm = document.getElementById('expense-form');
const incomeCategorySelect = document.getElementById('income-category');
const expenseCategorySelect = document.getElementById('expense-category');

// Helper to format currency
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Helper to format date
const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Function to populate category dropdowns
async function populateCategories() {
  incomeCategorySelect.innerHTML = '<option value="" disabled selected>Select category</option>';
  expenseCategorySelect.innerHTML = '<option value="" disabled selected>Select category</option>';
  try {
    const response = await fetch(`${apiUrl}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const categories = await response.json();
    categories.income.forEach(cat => {
      incomeCategorySelect.add(new Option(cat, cat));
    });
    categories.expenses.forEach(cat => {
      expenseCategorySelect.add(new Option(cat, cat));
    });
  } catch (error) {
    console.error('Error populating categories:', error);
    alert('Could not load categories. Please try again later.');
  }
}

// Fetches all data and re-renders the entire UI
async function refreshUI() {
  try {
    const response = await fetch(`${apiUrl}/transactions`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    const transactions = await response.json();

    // Clear previous list
    transactionList.innerHTML = '';

    // Calculate totals using Array.reduce
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    // Update summary
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('balance').textContent = formatCurrency(balance);

    // Render transaction list
    transactions.forEach(t => {
      const li = document.createElement('li');
      li.className = t.type === 'income' ? 'income-item' : 'expense-item';
      li.classList.add('mdc-list-item');
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
      transactionList.appendChild(li);
    });
  } catch (error) {
    console.error('Error refreshing UI:', error);
    alert('Could not load transaction data. Please try again later.');
  }
}

// Generic function to handle adding a transaction
async function addTransaction(event, type) {
  event.preventDefault();
  const amountInput = document.getElementById(`${type}-amount`);
  const categoryInput = document.getElementById(`${type}-category`);
  const amount = amountInput.value;
  const category = categoryInput.value;

  if (!category) {
    alert('Please select a category.');
    return; // Stop the function
  }

  try {
    const response = await fetch(`${apiUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amount, category, date: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error('Failed to add transaction');
  } catch (error) {
    console.error('Error adding transaction:', error);
    alert('Could not add transaction. Please try again.');
  }

  amountInput.value = '';
  categoryInput.value = '';
  await refreshUI();
}

// Event Listeners
incomeForm.addEventListener('submit', (e) => addTransaction(e, 'income'));
expenseForm.addEventListener('submit', (e) => addTransaction(e, 'expense'));

// Event listener for deleting transactions (using event delegation)
transactionList.addEventListener('click', async (event) => {
  if (event.target.classList.contains('delete-btn')) {
    const id = event.target.dataset.id;
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await fetch(`${apiUrl}/transactions/${id}`, { method: 'DELETE' });
        await refreshUI();
      } catch (error) {
        alert('Error deleting transaction.');
      }
    }
  }
});

// --- MDC Initialization ---
function initializeMDC() {
  document.querySelectorAll('.mdc-button').forEach(el => new mdc.ripple.MDCRipple(el));
  document.querySelectorAll('.mdc-icon-button').forEach(el => new mdc.ripple.MDCRipple(el));
}

// --- App Initialization ---
async function initializeApp() {
  initializeMDC();
  await populateCategories();
  await refreshUI();
}

initializeApp();