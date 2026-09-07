// utils.js

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(isoStr) {
  const date = new Date(isoStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateTime(isoStr) {
  const date = new Date(isoStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function timeAgo(isoStr) {
  const date = new Date(isoStr);
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

function maskAccountNumber(accNo) {
  if (!accNo || accNo.length < 4) return accNo;
  return 'XXXX-XXXX-' + accNo.substring(accNo.length - 4);
}

function generateTxnId() {
  return 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function getStatusBadgeClass(status) {
  const s = status.toLowerCase();
  if (['completed', 'active', 'verified', 'success'].includes(s)) return 'badge-success';
  if (['pending', 'processing', 'warning'].includes(s)) return 'badge-warning';
  if (['failed', 'rejected', 'error', 'inactive'].includes(s)) return 'badge-danger';
  return 'badge-info';
}

function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

function createTableRow(data, columns) {
  const tr = document.createElement('tr');
  columns.forEach(col => {
    const td = document.createElement('td');
    if (typeof col.render === 'function') {
      td.innerHTML = col.render(data);
    } else {
      td.textContent = data[col.key] || '';
    }
    if (col.className) td.className = col.className;
    tr.appendChild(td);
  });
  return tr;
}

function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
  }
}

function hideModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} toast-notification`;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.zIndex = '9999';
  toast.style.animation = 'slideIn 0.3s ease forwards';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function downloadCSV(data, filename) {
  if (!data || !data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
