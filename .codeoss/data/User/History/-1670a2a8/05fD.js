const apiUrl = ''; // Use relative paths for API calls
const transactionList = document.getElementById('transaction-list');
const incomeForm = document.getElementById('income-form');
const expenseForm = document.getElementById('expense-form');
const incomeCategorySelect = document.getElementById('income-category');
const expenseCategorySelect = document.getElementById('expense-category');

// This will hold our available dates from the server, e.g., { "2024": [5, 6, 7], "2023": [12] }
let availableDates = {};

// State for the new date filter
let selectedYear;
let selectedMonth;
let dateFilterMenu;
let defaultYear;
let defaultMonth;
let resetButton;

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

// Function to populate the new date filter menu
async function populateDateFilterMenu() {
  const response = await fetch(`${apiUrl}/transactions/dates`);
  availableDates = await response.json();

  const menuList = document.querySelector('#date-filter-menu .mdc-list');
  menuList.innerHTML = ''; // Clear existing items

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Object.keys(availableDates).sort((a, b) => b - a);
  const today = new Date();

  years.forEach(year => {
    // Add clickable year item
    const yearItem = document.createElement('li');
    yearItem.className = 'mdc-list-item year-item'; // Custom class for styling
    yearItem.setAttribute('role', 'menuitem');
    yearItem.dataset.year = year;
    yearItem.innerHTML = `<span class="mdc-list-item__ripple"></span><span class="mdc-list-item__text">${year}</span>`;
    menuList.appendChild(yearItem);

    const months = availableDates[year];
    months.forEach(month => {
      const li = document.createElement('li');
      li.className = 'mdc-list-item month-item'; // Custom class for styling
      li.setAttribute('role', 'menuitem');
      li.dataset.year = year;
      li.dataset.month = month;
      li.innerHTML = `<span class="mdc-list-item__ripple"></span><span class="mdc-list-item__text">${monthNames[month - 1]}</span>`;
      menuList.appendChild(li);
    });

    // Add a divider after each year group except the last one
    if (years.indexOf(year) < years.length - 1) {
      const divider = document.createElement('li');
      divider.className = 'mdc-list-divider';
      divider.setAttribute('role', 'separator');
      menuList.appendChild(divider);
    }
  });

  // The default view is always the current month and year.
  const currentYear = String(today.getFullYear());
  const currentMonth = String(today.getMonth() + 1);
  defaultYear = currentYear;
  defaultMonth = currentMonth;

  // Set the initial view to the default (current month and year).
  await setSelectedDate(defaultYear, defaultMonth);
}

// Fetches all data and re-renders the entire UI
async function refreshUI() {
  try {
    const response = await fetch(`${apiUrl}/transactions?year=${selectedYear}&month=${selectedMonth}`);
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

async function setSelectedDate(year, month) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const buttonLabel = document.querySelector('#date-filter-button .mdc-button__label');

  // Normalize to strings; month may be null/undefined
  selectedYear = year != null ? String(year) : null;
  selectedMonth = month != null ? String(month) : null;
  selectedYear = String(year);
  // Ensure month is either a string or null, never 'undefined' the string
  selectedMonth = (month != null && month !== 'undefined') ? String(month) : null;

  // If a month is provided, show "Month Year", otherwise just "Year"
  buttonLabel.textContent = selectedMonth ? `${monthNames[Number(selectedMonth) - 1]} ${selectedYear}` : selectedYear;

  // Compare selection with defaults to decide visibility of reset button
  // The selection is default if the year and month match the default values.
  // A null/undefined month in the selection should match a null/undefined default month.
  const isDefault = String(selectedYear) === String(defaultYear) && 
                    String(selectedMonth) === String(defaultMonth);
  const isDefault = selectedYear === defaultYear && selectedMonth === defaultMonth;

  await refreshUI();

  // Ensure resetButton exists; hide it when selection equals default
  if (resetButton) {
    resetButton.hidden = isDefault;
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

  // Initialize Date Filter Menu
  const menuEl = document.getElementById('date-filter-menu');
  dateFilterMenu = new mdc.menu.MDCMenu(menuEl);
  const dateFilterButton = document.getElementById('date-filter-button');
  dateFilterButton.addEventListener('click', () => {
    dateFilterMenu.open = !dateFilterMenu.open;
  });

  menuEl.addEventListener('MDCMenu:selected', async (event) => {
    const { year, month } = event.detail.item.dataset; // month will be undefined for year items
    await setSelectedDate(year, month);
  });

  // Initialize reset button and hide it by default to avoid flicker
  resetButton = document.getElementById('reset-date-filter-button');
  if (resetButton) {
    resetButton.hidden = true;
    resetButton.addEventListener('click', async () => {
      await setSelectedDate(defaultYear, defaultMonth);
    });
  }
}

// --- App Initialization ---
async function initializeApp() {
  initializeMDC();
  await populateCategories();
  await populateDateFilterMenu();
  // refreshUI is called by setSelectedDate inside populateDateFilterMenu
}

initializeApp();