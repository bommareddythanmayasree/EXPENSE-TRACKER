/* ---------- THEME: dark mode + persistence ---------- */
(function () {
  const toggles = document.querySelectorAll('#theme-toggle');

  function applyTheme(isDark) {
    if (isDark) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    toggles.forEach(t => { t.textContent = isDark ? '☀️' : '🌙'; });
  }

  const stored = localStorage.getItem('et_theme');
  const isDark = stored ? stored === 'dark' : false;
  applyTheme(isDark);

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const darkNow = !document.body.classList.contains('dark');
      applyTheme(darkNow);
      localStorage.setItem('et_theme', darkNow ? 'dark' : 'light');
    });
  });
})();

/* ---------- HOME PAGE LOGIN ---------- */
(function () {
  const loginBtn = document.getElementById('login-button');
  const nameInput = document.getElementById('name-input');
  if (!loginBtn) return;

  loginBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) {
      alert("Please enter your name");
      return;
    }
    localStorage.setItem('et_user', name);
    window.location.href = 'Tracker.html';
  });
})();

/* ---------- TRACKER PAGE ---------- */
(function () {
  const dateInput = document.getElementById('date-input');
  if (!dateInput) return; // Exit if not on tracker page

  // Display stored name
  const storedName = localStorage.getItem('et_user');
  if (storedName) {
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = `— Welcome, ${storedName}`;
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // DOM references
  const amountInput = document.getElementById('amount-input');
  const typeSelect = document.getElementById('type-select');
  const addButton = document.getElementById('add-button');
  const tbody = document.getElementById('transactions-body');
  const incomeRef = document.getElementById('income-amount');
  const expenseRef = document.getElementById('expense-amount');
  const balanceRef = document.getElementById('balance-amount');
  const filterType = document.getElementById('filter-type');
  const searchInput = document.getElementById('search-input');
  const exportCsvBtn = document.getElementById('export-csv');

  let transactions = JSON.parse(localStorage.getItem('et_transactions') || '[]');
  let pieChart = null;

  // Save transactions
  function save() {
    localStorage.setItem('et_transactions', JSON.stringify(transactions));
  }

  function formatCurrency(n) {
    return '₹ ' + Number(n || 0).toLocaleString();
  }

  // CRUD
  function addTransaction(amount, type, date) {
    if (!amount || isNaN(amount)) return;
    const t = { id: uid(), amount: Number(amount), type, date: date || new Date().toISOString().slice(0, 10) };
    transactions.unshift(t);
    save();
    renderAll();
  }

  function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    save();
    renderAll();
  }

  function editTransaction(id) {
    const t = transactions.find(x => x.id === id);
    if (!t) return;

    const newAmount = prompt('Enter new amount', t.amount);
    if (newAmount === null || isNaN(newAmount)) return;

    const newType = prompt('Enter type (Income/Expense)', t.type);
    if (!['Income', 'Expense'].includes(newType)) return;

    const newDate = prompt('Enter date (YYYY-MM-DD)', t.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return;

    t.amount = Number(newAmount);
    t.type = newType;
    t.date = newDate;
    save();
    renderAll();
  }

  // Search & Filter
  function filterTransactions(list) {
    const ft = filterType.value;
    const query = searchInput.value.trim().toLowerCase();
    return list.filter(t => {
      const matchesType = ft === 'All' ? true : t.type === ft;
      const matchesSearch =
        t.type.toLowerCase().includes(query) ||
        String(t.amount).toLowerCase().includes(query) ||
        t.date.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }

  // Render table
  function renderTable() {
    const filtered = filterTransactions(transactions);
    tbody.innerHTML = filtered.map(t => `
      <tr>
        <td>${formatCurrency(t.amount)}</td>
        <td>${t.type}</td>
        <td>${t.date}</td>
        <td>
          <button class="action-btn edit-btn" data-id="${t.id}">Edit</button>
          <button class="action-btn delete-btn" data-id="${t.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    // Attach events dynamically
    document.querySelectorAll('.edit-btn').forEach(btn =>
      btn.addEventListener('click', e => editTransaction(e.target.dataset.id))
    );
    document.querySelectorAll('.delete-btn').forEach(btn =>
      btn.addEventListener('click', e => {
        if (confirm('Delete this transaction?')) deleteTransaction(e.target.dataset.id);
      })
    );
  }

  // Render cards
  function renderCards() {
    const totals = transactions.reduce((acc, t) => {
      if (t.type === 'Income') acc.income += t.amount;
      else acc.expense += t.amount;
      acc.balance = acc.income - acc.expense;
      return acc;
    }, { income: 0, expense: 0, balance: 0 });

    incomeRef.textContent = formatCurrency(totals.income);
    expenseRef.textContent = formatCurrency(totals.expense);
    balanceRef.textContent = formatCurrency(totals.balance);
  }

  // Prepare chart data
  function prepareChartData() {
    const income = transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  }

  // Render charts
  function renderCharts() {
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    const { income, expense } = prepareChartData();

    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: ['Income', 'Expense'],
        datasets: [{
          data: [income, expense],
          backgroundColor: ['#7B61FF', '#B388EB']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  function renderAll() {
    renderCards();
    renderTable();
    renderCharts();
  }

  // Event listeners
  addButton.addEventListener('click', () => {
    const amt = amountInput.value;
    const tp = typeSelect.value;
    const dt = dateInput.value || new Date().toISOString().slice(0, 10);
    addTransaction(amt, tp, dt);
    amountInput.value = '';
  });

  filterType.addEventListener('change', renderTable);
  searchInput.addEventListener('input', renderTable);

  exportCsvBtn.addEventListener('click', () => {
    const rows = [['amount', 'type', 'date']];
    transactions.slice().reverse().forEach(t => {
      rows.push([t.amount, t.type, t.date]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Init
  renderAll();
})();
