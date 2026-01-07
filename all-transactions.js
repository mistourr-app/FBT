const transactionList = document.getElementById('all-transaction-list');
const pageDescription = document.getElementById('page-description');
const periodSelect = document.getElementById('period-select');

// State for the date filter
let selectedYear;
let selectedMonth;

// Helper to format currency
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Helper to format date
const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Sets the selected date and triggers a UI refresh
function setSelectedDate(year, month) {
    selectedYear = (year && year !== 'all') ? String(year) : null;
    selectedMonth = (month && month !== 'null') ? String(month) : null;

    // Update sessionStorage so the selection persists if the user navigates away and back
    sessionStorage.setItem('selectedYear', selectedYear || '');
    sessionStorage.setItem('selectedMonth', selectedMonth || '');

    renderAllTransactions();
}

// Renders the list of all transactions for the selected period
function renderAllTransactions() {
    try {
        const transactions = db.getTransactions(selectedYear, selectedMonth);

        // Sort transactions from latest to earliest
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Update page description
        pageDescription.textContent = `Showing all transactions for ${formatPeriodDescription(selectedYear, selectedMonth)}.`;

        // Clear previous list
        transactionList.innerHTML = '';

        if (transactions.length === 0) {
            transactionList.innerHTML = '<li class="mdc-list-item"><span class="mdc-list-item__text">No transactions found for this period.</span></li>';
            return;
        }

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
                </span>
            `;
            transactionList.appendChild(li);
        });

    } catch (error) {
        console.error('Error rendering all transactions:', error);
        pageDescription.textContent = 'Could not load transaction data. Please try again later.';
    }
}

function initializeApp() {
    // Initialize MDC components
    document.querySelectorAll('.mdc-button').forEach(el => new mdc.ripple.MDCRipple(el));

    // Ensure the select element is full-width
    periodSelect.style.width = '100%';

    // Use the shared utility to create the period selector
    createPeriodSelector(periodSelect, setSelectedDate);
}

initializeApp();