const state = {
  page: 1,
  count: 0,
  next: null,
  previous: null,
};

const elements = {
  rows: document.querySelector('#employeeRows'),
  search: document.querySelector('#search'),
  joinedFrom: document.querySelector('#joined_from'),
  joinedTo: document.querySelector('#joined_to'),
  pageSize: document.querySelector('#page_size'),
  resultCount: document.querySelector('#resultCount'),
  pageInfo: document.querySelector('#pageInfo'),
  prevPage: document.querySelector('#prevPage'),
  nextPage: document.querySelector('#nextPage'),
};

function params() {
  const query = new URLSearchParams({
    page: state.page,
    page_size: elements.pageSize.value,
  });
  if (elements.search.value.trim()) query.set('search', elements.search.value.trim());
  if (elements.joinedFrom.value) query.set('joined_from', elements.joinedFrom.value);
  if (elements.joinedTo.value) query.set('joined_to', elements.joinedTo.value);
  return query;
}

function money(value) {
  return Number(value).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function render(data) {
  state.count = data.count;
  state.next = data.next;
  state.previous = data.previous;
  elements.resultCount.textContent = `${data.count.toLocaleString()} employees`;
  elements.pageInfo.textContent = `Page ${state.page}`;
  elements.prevPage.disabled = !data.previous;
  elements.nextPage.disabled = !data.next;
  elements.rows.innerHTML = data.results.map((employee) => `
    <tr>
      <td>${employee.id}</td>
      <td>${employee.first_name} ${employee.last_name}</td>
      <td>${employee.email}</td>
      <td>${employee.phone_number}</td>
      <td>${employee.department.name}</td>
      <td>${employee.position.title}</td>
      <td>${employee.date_of_joining}</td>
      <td>${money(employee.salary)}</td>
    </tr>
  `).join('');
}

async function loadEmployees() {
  elements.resultCount.textContent = 'Loading employees...';
  const response = await fetch(`/api/employees/?${params()}`);
  if (!response.ok) {
    elements.resultCount.textContent = 'Could not load employees.';
    return;
  }
  render(await response.json());
}

function debounce(fn, delay = 350) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function resetAndLoad() {
  state.page = 1;
  loadEmployees();
}

elements.search.addEventListener('input', debounce(resetAndLoad));
elements.joinedFrom.addEventListener('change', resetAndLoad);
elements.joinedTo.addEventListener('change', resetAndLoad);
elements.pageSize.addEventListener('change', resetAndLoad);
elements.prevPage.addEventListener('click', () => {
  if (state.previous) {
    state.page -= 1;
    loadEmployees();
  }
});
elements.nextPage.addEventListener('click', () => {
  if (state.next) {
    state.page += 1;
    loadEmployees();
  }
});

document.querySelectorAll('[data-export]').forEach((button) => {
  button.addEventListener('click', () => {
    window.location = `/api/employees/export/${button.dataset.export}/?${params()}`;
  });
});

loadEmployees();
