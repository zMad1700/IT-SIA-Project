// Activity charts updated with modern SaaS aesthetic

import { icon } from '../utils/dom.js';
import { getAccounts } from '../services/storage.js';
import { buildDateBuckets } from '../utils/analytics.js';

let activityScholarType = 'total';
let activityPeriod = 'monthly';
let registeredActivityPeriod = 'monthly';

export const registeredActivityData = period => {
  const accounts = getAccounts().filter(
    account => account.role === 'user' && !account.addedByAdmin && account.registeredAt
  );
  return buildDateBuckets(accounts, period, a => new Date(a.registeredAt));
};

export const registeredActivityChart = () => {
  const data = registeredActivityData(registeredActivityPeriod);
  const highest = Math.max(...data.map(item => item.count), 1);
  const periodLabel =
    registeredActivityPeriod === 'daily'
      ? 'last 7 days'
      : registeredActivityPeriod === 'yearly'
        ? 'last 5 years'
        : 'last 12 months';

  return `<div class="card-header">
    <div>
      <h2 class="card-title">Registration Trends</h2>
      <p class="card-subtitle">Verified student accounts created over the ${periodLabel}.</p>
    </div>
    <div class="select-pill-wrapper">
      <select id="registered-activity-period" class="pill-select compact-select" aria-label="Registration chart period">
        <option value="daily" ${registeredActivityPeriod === 'daily' ? 'selected' : ''}>Daily</option>
        <option value="monthly" ${registeredActivityPeriod === 'monthly' ? 'selected' : ''}>Monthly</option>
        <option value="yearly" ${registeredActivityPeriod === 'yearly' ? 'selected' : ''}>Yearly</option>
      </select>
    </div>
  </div>
  <div class="chart-modern-container">
    <div class="bars-modern">
      ${data
        .map(
          item =>
            `<div class="bar-col">
              <div class="bar-fill-track">
                <i style="height:${Math.max((item.count / highest) * 100, item.count ? 8 : 0)}%" title="${item.count} registration${item.count === 1 ? '' : 's'}"></i>
              </div>
              <span class="bar-col-label">${item.label}</span>
            </div>`
        )
        .join('')}
    </div>
    <div class="chart-y-axis">
      <span>${highest}</span>
      <span>${Math.ceil((highest * 2) / 3)}</span>
      <span>${Math.ceil(highest / 3)}</span>
      <span>0</span>
    </div>
  </div>`;
};

export const renderRegisteredActivityChart = () => {
  const chart = document.querySelector('#registered-activity-chart');
  if (!chart) return;
  chart.innerHTML = registeredActivityChart();
  const select = document.querySelector('#registered-activity-period');
  if (select) {
    select.onchange = event => {
      registeredActivityPeriod = event.target.value;
      renderRegisteredActivityChart();
    };
  }
};

export const scholarActivityData = (type, period) => {
  const scholars = getAccounts().filter(
    account =>
      account.role === 'user' &&
      ['Old scholar', 'New scholar'].includes(account.scholarType) &&
      (type === 'total' || account.scholarType === type)
  );
  return buildDateBuckets(scholars, period, account => new Date(account.registeredAt || Date.now()));
};

export const scholarActivityChart = () => {
  const data = scholarActivityData(activityScholarType, activityPeriod);
  const highest = Math.max(...data.map(item => item.count), 1);
  const title =
    activityScholarType === 'total'
      ? 'Total scholars'
      : activityScholarType === 'Old scholar'
        ? 'Active scholars'
        : 'New scholars';
  const periodLabel =
    activityPeriod === 'daily'
      ? 'last 7 days'
      : activityPeriod === 'yearly'
        ? 'last 5 years'
        : 'last 12 months';

  return `<div class="card-header">
    <div>
      <h2 class="card-title">${title} Activity</h2>
      <p class="card-subtitle">Verified enrollments over the ${periodLabel}.</p>
    </div>
    <div class="chart-header-controls">
      <div class="select-pill-wrapper">
        <select id="activity-scholar-type" class="pill-select compact-select" aria-label="Scholar category">
          <option value="total" ${activityScholarType === 'total' ? 'selected' : ''}>Total Scholars</option>
          <option value="Old scholar" ${activityScholarType === 'Old scholar' ? 'selected' : ''}>Active Scholars</option>
          <option value="New scholar" ${activityScholarType === 'New scholar' ? 'selected' : ''}>New Scholars</option>
        </select>
      </div>
      <div class="select-pill-wrapper">
        <select id="activity-period" class="pill-select compact-select" aria-label="Chart period">
          <option value="daily" ${activityPeriod === 'daily' ? 'selected' : ''}>Daily</option>
          <option value="monthly" ${activityPeriod === 'monthly' ? 'selected' : ''}>Monthly</option>
          <option value="yearly" ${activityPeriod === 'yearly' ? 'selected' : ''}>Yearly</option>
        </select>
      </div>
    </div>
  </div>
  <div class="chart-modern-container">
    <div class="bars-modern">
      ${data
        .map(
          item =>
            `<div class="bar-col">
              <div class="bar-fill-track">
                <i style="height:${Math.max((item.count / highest) * 100, item.count ? 8 : 0)}%" title="${item.count} scholar${item.count === 1 ? '' : 's'}"></i>
              </div>
              <span class="bar-col-label">${item.label}</span>
            </div>`
        )
        .join('')}
    </div>
    <div class="chart-y-axis">
      <span>${highest}</span>
      <span>${Math.ceil((highest * 2) / 3)}</span>
      <span>${Math.ceil(highest / 3)}</span>
      <span>0</span>
    </div>
  </div>`;
};

export const renderScholarActivityChart = () => {
  const chartCard = document.querySelector('.admin .chart-card');
  if (!chartCard) return;
  chartCard.innerHTML = scholarActivityChart();
  const typeSelect = document.querySelector('#activity-scholar-type');
  const periodSelect = document.querySelector('#activity-period');
  if (typeSelect) {
    typeSelect.onchange = event => {
      activityScholarType = event.target.value;
      renderScholarActivityChart();
    };
  }
  if (periodSelect) {
    periodSelect.onchange = event => {
      activityPeriod = event.target.value;
      renderScholarActivityChart();
    };
  }
};
