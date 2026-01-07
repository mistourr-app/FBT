const transactionList = document.getElementById('transaction-list');
const incomeForm = document.getElementById('income-form');
const expenseForm = document.getElementById('expense-form');
const resetPeriodBtn = document.getElementById('reset-period-btn');

const incomeCategorySelect = document.getElementById('income-category');
const expenseCategorySelect = document.getElementById('expense-category');

// State for the date filter
let availableDates = {};
let selectedYear;
let selectedMonth;
let defaultYear;
let defaultMonth;

// Shows or hides the reset button based on the current selection
function updateResetButtonVisibility() {
  // The button should be visible if the selected period is not the default one.
  // Note: selectedMonth can be null for year-only views, but defaultMonth is always set.
  const isDefaultSelected = selectedYear === defaultYear && selectedMonth === defaultMonth;
  if (isDefaultSelected) {
    resetPeriodBtn.classList.add('hidden');
  } else {
    resetPeriodBtn.classList.remove('hidden');
  }
}

// Helper to format currency
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Helper to format date
const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Function to populate category dropdowns
function populateCategories() {
  incomeCategorySelect.innerHTML = '<option value="" disabled selected>Select category</option>';
  expenseCategorySelect.innerHTML = '<option value="" disabled selected>Select category</option>';
  try {
    // Replaced fetch with local db call
    const categories = db.getCategories();
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

// Function to populate the date filter dropdown
function populateDateFilter() {
  // Replaced fetch with local db call
  availableDates = db.getAvailableDates();

  const selectEl = document.getElementById('period-select');
  selectEl.innerHTML = ''; // Clear existing items

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; // Keep for formatting
  const years = Object.keys(availableDates).sort((a, b) => b - a);
  const today = new Date();

  // Set the default view to the current month and year.
  defaultYear = String(today.getFullYear());
  defaultMonth = String(today.getMonth() + 1);

  years.forEach(year => {
    // Make the year option selectable to view the whole year's summary.
    // The value 'YYYY-null' tells the backend to fetch data for the entire year.
    const yearOption = new Option(year, `${year}-null`);
    selectEl.appendChild(yearOption);

    const months = availableDates[year];
    months.forEach(month => {
      // Indent month names for better visual grouping under the year
      // The text in the list will just be the month name.
      const listText = `  ${monthNames[month - 1]}`;
      // The text when selected will be 'Month, Year'.
      const displayText = `  ${monthNames[month - 1]}, ${year}`;

      const monthOption = new Option(listText, `${year}-${month}`);
      // Store both text formats in data attributes to swap them later.
      monthOption.dataset.listText = listText;
      monthOption.dataset.displayText = displayText;
      selectEl.appendChild(monthOption);
    });
  });

  // Set the initial view to the default (current month and year).
  const defaultValue = `${defaultYear}-${defaultMonth}`;
  // Set the value, but don't change the text content yet.
  // The initializeMDC function will handle the initial text display.
  if (selectEl.querySelector(`option[value="${defaultValue}"]`)) {
    selectEl.value = defaultValue;
  }
  // If the default date isn't in the list, it will default to the first option.

  setSelectedDate(defaultYear, defaultMonth);

  // Now that the options are populated, update the text of the initial selection.
  updateSelectedOptionText(selectEl);
}

// Fetches all data and re-renders the entire UI
function refreshUI() {
  try {
    // Replaced fetch with local db call
    const transactions = db.getTransactions(selectedYear, selectedMonth);

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
function setSelectedDate(year, month) {
  selectedYear = String(year);
  // Ensure month is either a string or null, not the string 'null'
  selectedMonth = (month && month !== 'null') ? String(month) : null;
  refreshUI();
  updateResetButtonVisibility();
}

// Generic function to handle adding a transaction
function addTransaction(event, type) {
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
    // Replaced fetch with local db call
    db.addTransaction({ type, amount, category, date: new Date().toISOString() });
  } catch (error) {
    console.error('Error adding transaction:', error);
    alert('Could not add transaction. Please try again.');
  }

  amountInput.value = '';
  categoryInput.value = '';
  refreshUI();
}

// Event Listeners
incomeForm.addEventListener('submit', (e) => addTransaction(e, 'income'));
expenseForm.addEventListener('submit', (e) => addTransaction(e, 'expense'));

// Event listener for deleting transactions (using event delegation)
transactionList.addEventListener('click', (event) => {
  if (event.target.classList.contains('delete-btn')) {
    const id = event.target.dataset.id;
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        // Replaced fetch with local db call
        db.deleteTransaction(parseInt(id, 10));
        refreshUI();
      } catch (error) {
        alert('Error deleting transaction.');
      }
    }
  }
});

// Helper to update the text of the selected option to 'Month, Year'
// and reset others to just 'Month'.
function updateSelectedOptionText(selectElement) {
  for (const option of selectElement.options) {
    // Check if the option has our custom data attributes
    if (option.dataset.listText) {
      if (option.selected) {
        option.textContent = option.dataset.displayText;
      } else {
        option.textContent = option.dataset.listText;
      }
    }
  }
}

// --- MDC Initialization ---
function initializeMDC() {
  document.querySelectorAll('.mdc-button').forEach(el => new mdc.ripple.MDCRipple(el));
  document.querySelectorAll('.mdc-icon-button').forEach(el => new mdc.ripple.MDCRipple(el));

  // Add event listener for the reset period button
  resetPeriodBtn.addEventListener('click', () => {
    const selectEl = document.getElementById('period-select');
    // Set the dropdown value back to the default
    const defaultValue = `${defaultYear}-${defaultMonth}`;
    if (selectEl.querySelector(`option[value="${defaultValue}"]`)) {
      selectEl.value = defaultValue;
    }
    // Update the display text of the dropdown
    updateSelectedOptionText(selectEl);
    // Fetch data for the default period
    setSelectedDate(defaultYear, defaultMonth);
  });

  // Add event listener for the period select dropdown
  const periodSelect = document.getElementById('period-select');

  // On change, update text and fetch new data.
  periodSelect.addEventListener('change', (event) => {
    const [year, month] = event.target.value.split('-');
    updateSelectedOptionText(event.target);
    setSelectedDate(year, month);
  });

  // When the user focuses on the select (to open it),
  // reset all month options to their short list format.
  periodSelect.addEventListener('focus', () => {
    for (const option of periodSelect.options) {
      if (option.dataset.listText) {
        option.textContent = option.dataset.listText;
      }
    }
  });

  // When the user clicks away (closing the dropdown),
  // update the selected option to its long display format.
  periodSelect.addEventListener('blur', () => {
    updateSelectedOptionText(periodSelect);
  });
}

// --- App Initialization ---
function initializeApp() {
  initializeMDC();
  populateCategories();
  // This will populate the filter and trigger the initial UI refresh for the current month
  populateDateFilter();
}

initializeApp();