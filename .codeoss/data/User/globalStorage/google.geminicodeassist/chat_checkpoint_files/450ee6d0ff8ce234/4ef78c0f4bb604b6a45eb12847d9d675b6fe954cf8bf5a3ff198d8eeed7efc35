const apiUrl = ''; // Use relative paths for API calls
const transactionList = document.getElementById('transaction-list');
const incomeForm = document.getElementById('income-form');
const expenseForm = document.getElementById('expense-form');

// These will be initialized as MDCSelect components
let incomeCategorySelect;
let expenseCategorySelect;
let periodSelect;

// State for the date filter
let availableDates = {};
let selectedYear;
let selectedMonth;
let defaultYear;
let defaultMonth;


// Helper to format currency
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Helper to format date
const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Function to populate category dropdowns
async function populateCategories() {
  const incomeList = document.getElementById('income-category');
  const expenseList = document.getElementById('expense-category');
  incomeList.innerHTML = '';
  expenseList.innerHTML = '';

  try {
    const response = await fetch(`${apiUrl}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const categories = await response.json();
    categories.income.forEach(cat => {
      incomeList.innerHTML += `<li class="mdc-list-item" data-value="${cat}">${cat}</li>`;
    });
    categories.expenses.forEach(cat => {
      expenseList.innerHTML += `<li class="mdc-list-item" data-value="${cat}">${cat}</li>`;
    });
  } catch (error) {
    console.error('Error populating categories:', error);
    alert('Could not load categories. Please try again later.');
  }
}

// Function to populate the date filter dropdown
async function populateDateFilter() {
  const response = await fetch(`${apiUrl}/transactions/dates`);
  availableDates = await response.json();

  const listEl = document.getElementById('period-select');
  listEl.innerHTML = ''; // Clear existing items

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; // Keep for formatting
  const years = Object.keys(availableDates).sort((a, b) => b - a);
  const today = new Date();

  // Set the default view to the current month and year.
  defaultYear = String(today.getFullYear());
  defaultMonth = String(today.getMonth() + 1);

  years.forEach(year => {
    // Make the year option selectable to view the whole year's summary.
    // The value 'YYYY-null' tells the backend to fetch data for the entire year.
    listEl.innerHTML += `<li class="mdc-list-item" data-value="${year}-null">${year}</li>`;

    const months = availableDates[year];
    months.forEach(month => {
      // Indent month names for better visual grouping under the year
      // The text in the list will just be the month name.
      const displayText = `${monthNames[month - 1]}, ${year}`;
      listEl.innerHTML += `<li class="mdc-list-item" data-value="${year}-${month}">${displayText}</li>`;
    });
  });

  // Set the initial view to the default (current month and year).
  const defaultValue = `${defaultYear}-${defaultMonth}`;
  // Check if the default value exists in the list before setting it
  if (listEl.querySelector(`[data-value="${defaultValue}"]`)) {
    periodSelect.value = defaultValue;
  } else if (periodSelect.options.length > 0) {
    // Fallback to the first item if the default doesn't exist
    periodSelect.value = periodSelect.options[0].value;
  }

  await setSelectedDate(defaultYear, defaultMonth);
}

// Fetches all data and re-renders the entire UI
async function refreshUI() {
  try {
    // Build the query string for filtering
    const query = new URLSearchParams({ year: selectedYear, month: selectedMonth }).toString();
    const response = await fetch(`${apiUrl}/transactions?${query}`);
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

// Sets the selected date and triggers a UI refresh
async function setSelectedDate(year, month) {
  selectedYear = String(year);
  // Ensure month is either a string or null, not the string 'null'
  selectedMonth = (month && month !== 'null') ? String(month) : null;
  await refreshUI();
}

// Generic function to handle adding a transaction
async function addTransaction(event, type) {
  event.preventDefault();
  const amountInput = document.getElementById(`${type}-amount`);
  const amount = amountInput.value;
  const selectComponent = type === 'income' ? incomeCategorySelect : expenseCategorySelect;
  const category = selectComponent.value;

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
  selectComponent.value = ''; // Reset the MDCSelect
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

  // Initialize MDC Select components
  incomeCategorySelect = new mdc.select.MDCSelect(document.getElementById('income-category-container'));
  expenseCategorySelect = new mdc.select.MDCSelect(document.getElementById('expense-category-container'));
  periodSelect = new mdc.select.MDCSelect(document.getElementById('period-select-container'));

  // Add event listener for the period select dropdown
  periodSelect.listen('MDCSelect:change', async () => {
    const [year, month] = periodSelect.value.split('-');
    await setSelectedDate(year, month);
  });
}

// --- App Initialization ---
async function initializeApp() {
  initializeMDC();
  await populateCategories();
  // This will populate the filter and trigger the initial UI refresh for the current month
  await populateDateFilter();
}

initializeApp();