const incomeList = document.getElementById('income-list');
const expenseList = document.getElementById('expense-list');
let renameDialog, renameTextField;
let categoryToRename = {};

// Function to render a list of categories
function renderCategoryList(listElement, categories, type) {
    listElement.innerHTML = '';
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${cat}</span>
            <div class="controls">
                <button class="rename-btn" data-type="${type}" data-name="${cat}" title="Rename"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete-btn" data-type="${type}" data-name="${cat}" title="Delete"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        listElement.appendChild(li);
    });
}

// Fetch and render all categories from the local DB
function refreshCategoryLists() {
    try {
        const categories = db.getCategories();
        renderCategoryList(incomeList, categories.income, 'income');
        renderCategoryList(expenseList, categories.expenses, 'expense');
    } catch (error) {
        console.error('Error rendering categories:', error);
        alert('Error: Could not render categories.');
    }
}

// Handle adding a new category
function addCategory(event, type) {
    event.preventDefault();
    const input = document.getElementById(`new-${type}-category`);
    const name = input.value.trim();
    if (!name) return;

    try {
        db.addCategory(type, name);
        input.value = '';
        refreshCategoryLists();
    } catch (error) {
        alert(`Error adding category: ${error.message}`);
    }
}

// Handle initiating a category rename
function openRenameDialog(type, oldName) {
    // Store the category info and open the dialog
    categoryToRename = { type, oldName };
    renameTextField.value = oldName;
    // We need to re-layout the text field label
    renameTextField.layout();
    renameDialog.open();
    document.getElementById('rename-input').focus();
}

// Handle deleting a category
function deleteCategory(type, name) {
    if (!confirm(`Are you sure you want to delete the category "${name}"? This cannot be undone.`)) return;

    try {
        db.deleteCategory(type, name);
        refreshCategoryLists();
    } catch (error) {
        alert(`Error deleting category: ${error.message}`);
    }
}

// Event Listeners
document.getElementById('add-income-form').addEventListener('submit', (e) => addCategory(e, 'income'));
document.getElementById('add-expense-form').addEventListener('submit', (e) => addCategory(e, 'expense'));

// Use event delegation for rename and delete buttons on the category manager
document.querySelector('.category-manager').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const { type, name } = button.dataset;

    if (button.classList.contains('rename-btn')) {
        openRenameDialog(type, name);
    } else if (button.classList.contains('delete-btn')) {
        deleteCategory(type, name);
    }
});

// --- App Initialization ---
function initializeApp() {
    // Initialize standard MDC components
    document.querySelectorAll('.mdc-button').forEach(el => new mdc.ripple.MDCRipple(el));

    // Initialize Dialog
    const dialogElement = document.getElementById('rename-dialog');
    renameDialog = new mdc.dialog.MDCDialog(dialogElement);
    renameTextField = new mdc.textField.MDCTextField(document.getElementById('rename-field-mdc'));

    // Add listener for when the dialog closes to perform the rename action
    renameDialog.listen('MDCDialog:closing', (event) => {
        if (event.detail.action === 'accept') {
            const newName = renameTextField.value.trim();
            const { type, oldName } = categoryToRename;

            if (!newName || newName === oldName) return;

            try {
                db.renameCategory(type, oldName, newName);
                refreshCategoryLists();
            } catch (error) {
                alert(`Error renaming category: ${error.message}`);
            }
        }
    });

    refreshCategoryLists();
}

initializeApp();