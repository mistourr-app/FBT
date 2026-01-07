/**
 * period-selector-util.js
 *
 * Shared utility functions for populating and managing the period selection dropdown.
 * This ensures consistent behavior across the main page and the all-transactions page.
 */

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Populates a <select> element with years and months from available transaction dates.
 *
 * @param {HTMLSelectElement} periodSelect - The <select> element to populate.
 * @param {function} onDateSelected - The callback function to execute when a date is selected.
 *                                    It receives (year, month) as arguments.
 */
function createPeriodSelector(periodSelect, onDateSelected) {
    const availableDates = db.getAvailableDates();
    periodSelect.innerHTML = ''; // Clear existing items

    const years = Object.keys(availableDates).sort((a, b) => b - a);

    years.forEach(year => {
        // Add an option for the entire year
        const yearOption = new Option(year, `${year}-null`);
        yearOption.style.fontWeight = 'bold';
        yearOption.style.color = '#333';
        periodSelect.appendChild(yearOption);

        // Add options for each month within the year
        const months = availableDates[year];
        months.forEach(month => {
            const monthOption = new Option(`${monthNames[month - 1]}`, `${year}-${month}`);
            monthOption.style.paddingLeft = '20px'; // Indent months
            periodSelect.appendChild(monthOption);
        });
    });

    // Determine the initial state
    const sessionYear = sessionStorage.getItem('selectedYear');
    const sessionMonth = sessionStorage.getItem('selectedMonth');

    const today = new Date();
    const defaultYear = String(today.getFullYear());
    const defaultMonth = String(today.getMonth() + 1);

    const initialYear = sessionYear || defaultYear;
    const initialMonth = sessionMonth || defaultMonth;

    // Set the dropdown's value
    let initialValue = `${initialYear}-${initialMonth}`;
    if (initialMonth === 'null' || !initialMonth) {
        initialValue = `${initialYear}-null`;
    }

    // Check if the value exists, otherwise fall back
    if (periodSelect.querySelector(`option[value="${initialValue}"]`)) {
        periodSelect.value = initialValue;
    } else if (periodSelect.querySelector(`option[value="${defaultYear}-${defaultMonth}"]`)) {
        periodSelect.value = `${defaultYear}-${defaultMonth}`;
    }

    // Set initial date for rendering
    const [year, month] = periodSelect.value.split('-');
    onDateSelected(year, month);

    // --- Event Listener ---
    const updateSelectedText = () => {
        const selectedOption = periodSelect.options[periodSelect.selectedIndex];
        if (!selectedOption) return;

        // Reset all month options to their original text
        Array.from(periodSelect.options).forEach(opt => {
            if (opt.dataset.originalText) {
                opt.text = opt.dataset.originalText;
            }
        });

        const [selectedYear, selectedMonth] = selectedOption.value.split('-');
        if (selectedMonth && selectedMonth !== 'null') {
            selectedOption.dataset.originalText = selectedOption.text; // Store original text
            selectedOption.text = `${selectedOption.text}, ${selectedYear}`;
        }
    };

    periodSelect.addEventListener('change', (event) => {
        const [newYear, newMonth] = event.target.value.split('-');
        onDateSelected(newYear, newMonth);
        updateSelectedText();
    });

    // --- Reset Button Logic ---
    const resetButton = periodSelect.nextElementSibling; // Assumes reset button is the next sibling
    if (resetButton && resetButton.id.includes('reset-period-btn')) {
        const updateResetButton = () => {
            const isDefaultSelected = periodSelect.value === `${defaultYear}-${defaultMonth}`;
            if (isDefaultSelected) {
                resetButton.classList.add('hidden');
            } else {
                resetButton.classList.remove('hidden');
            }
        };

        resetButton.addEventListener('click', () => {
            let defaultValue = `${defaultYear}-${defaultMonth}`;
            if (periodSelect.querySelector(`option[value="${defaultValue}"]`)) {
                periodSelect.value = defaultValue;
                const [y, m] = defaultValue.split('-');
                onDateSelected(y, m);
                updateSelectedText();
            }
        });

        // Listen for changes to update visibility
        periodSelect.addEventListener('change', updateResetButton); // Already added, but good to be explicit
        // Initial check
        updateResetButton();
    }

    // Set initial display text
    updateSelectedText();
}

/**
 * Helper to format a period description string.
 * @param {string} year - The selected year.
 * @param {string|null} month - The selected month ('1'-'12' or null).
 * @returns {string} - A formatted string like "January, 2024" or "2024".
 */
function formatPeriodDescription(year, month) {
    if (month && month !== 'null') {
        return `${monthNames[parseInt(month, 10) - 1]}, ${year}`;
    }
    if (year) {
        return year;
    }
    return 'No period selected';
}