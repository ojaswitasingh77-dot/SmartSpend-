// ===================
// SmartSpend JS Logic
// ===================

// DOM Elements
const balanceEl = document.getElementById('current-balance');
const budgetProgressEl = document.getElementById('budget-progress');
const budgetSummaryEl = document.getElementById('budget-summary');
const addBtn = document.getElementById('add-expense-btn');
const insightsBtn = document.getElementById('view-insights-btn');
const formModal = document.getElementById('form-modal');
const closeBtn = document.querySelector('.close-btn');
const form = document.getElementById('transaction-form');
const transactionsList = document.getElementById('transactions-list');
const searchInput = document.getElementById('search');
const insightsSection = document.getElementById('insights-section');
const backDashboard = document.getElementById('back-dashboard');
const categoryChartCtx = document.getElementById('categoryChart').getContext('2d');
const weeklyChartCtx = document.getElementById('weeklyChart').getContext('2d');

// App State
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 5000;

// ===================
// Modal Logic
// ===================
addBtn.addEventListener('click', () => formModal.style.display = 'flex');
closeBtn.addEventListener('click', () => formModal.style.display = 'none');
window.onclick = (e) => { if(e.target === formModal) formModal.style.display = 'none'; };

// ===================
// Form Submit
// ===================
form.addEventListener('submit', e => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const payment = document.getElementById('payment-method').value;
  const date = document.getElementById('date').value || new Date().toISOString().slice(0,10);
  const note = document.getElementById('note').value;

  const transaction = { amount, type, category, payment, date, note };
  transactions.push(transaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));

  form.reset();
  formModal.style.display = 'none';
  alert('Transaction Added ✅');
  updateDashboard();
  renderTransactions();
});

// ===================
// Dashboard Update
// ===================
function updateDashboard() {
  const totalIncome = transactions.filter(t => t.type==='income').reduce((sum,t)=>sum+t.amount,0);
  const totalExpense = transactions.filter(t => t.type==='expense').reduce((sum,t)=>sum+t.amount,0);
  const balance = totalIncome - totalExpense;
  balanceEl.innerText = balance.toFixed(2);

  // Progress Bar
  const usedPercent = Math.min((totalExpense / monthlyBudget)*100, 100);
  budgetProgressEl.style.width = usedPercent + '%';
  if(usedPercent<=60) budgetProgressEl.style.background = '#00B894';
  else if(usedPercent<=80) budgetProgressEl.style.background = '#FFDD59';
  else budgetProgressEl.style.background = '#FF7675';

  budgetSummaryEl.innerText = `You’ve spent ₹${totalExpense} of ₹${monthlyBudget} budget`;

  renderCharts();
}

// ===================
// Render Transactions
// ===================
function renderTransactions(filter='') {
  transactionsList.innerHTML = '';
  transactions
    .filter(t => t.category.toLowerCase().includes(filter.toLowerCase()) || (t.note && t.note.toLowerCase().includes(filter.toLowerCase())))
    .sort((a,b) => new Date(b.date) - new Date(a.date))
    .forEach((t,i)=>{
      const li = document.createElement('li');
      li.innerHTML = `<span>${t.date} | ${t.type==='expense'?'💸':'💰'} ${t.category} ₹${t.amount}</span><span>${t.note||''}</span>`;
      transactionsList.appendChild(li);
    });
}

// ===================
// Search
// ===================
searchInput.addEventListener('input', e => renderTransactions(e.target.value));

// ===================
// Insights Charts
// ===================
function renderCharts() {
  // Category Pie
  const categoryTotals = {};
  transactions.forEach(t => {
    if(t.type==='expense') categoryTotals[t.category] = (categoryTotals[t.category]||0)+t.amount;
  });
  const categoryData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: ['#00B894','#74B9FF','#FF7675','#FD79A8','#FFEAA7','#A29BFE']
    }]
  };
  if(window.categoryChart) window.categoryChart.destroy();
  window.categoryChart = new Chart(categoryChartCtx, {
    type:'pie',
    data: categoryData
  });

  // Weekly Bar
  const weeklyTotals = [0,0,0,0];
  const today = new Date();
  transactions.forEach(t=>{
    if(t.type==='expense') {
      const d = new Date(t.date);
      if(d.getMonth()===today.getMonth() && d.getFullYear()===today.getFullYear()){
        const week = Math.floor(d.getDate()/7);
        weeklyTotals[week] += t.amount;
      }
    }
  });
  const weeklyData = {
    labels:['Week1','Week2','Week3','Week4'],
    datasets:[{
      label:'Weekly Spend',
      data: weeklyTotals,
      backgroundColor: weeklyTotals.map(v=> v<=monthlyBudget/4 ? '#00B894':'#FF7675')
    }]
  };
  if(window.weeklyChart) window.weeklyChart.destroy();
  window.weeklyChart = new Chart(weeklyChartCtx, {
    type:'bar',
    data: weeklyData,
    options:{plugins:{legend:{display:false}}}
  });
}

// ===================
// Insights Section
// ===================
insightsBtn.addEventListener('click', ()=>{
  document.querySelector('main').classList.add('hidden');
  insightsSection.classList.remove('hidden');
});
backDashboard.addEventListener('click', ()=>{
  insightsSection.classList.add('hidden');
  document.querySelector('main').classList.remove('hidden');
});

// ===================
// Initialize App
// ===================
updateDashboard();
renderTransactions();
