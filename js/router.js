// router.js

function updateBreadcrumb(items) {
  const breadcrumbEl = document.querySelector('.breadcrumb');
  if (!breadcrumbEl) return;
  
  let html = '';
  items.forEach((item, index) => {
    if (index === items.length - 1) {
      html += `<span>${item.label}</span>`;
    } else {
      html += `<a href="${item.href}">${item.label}</a> <span>/</span> `;
    }
  });
  
  breadcrumbEl.innerHTML = html;
}

function navigateTo(url) {
  window.location.href = url;
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function setPageTitle(title) {
  const titleEl = document.querySelector('.page-title');
  if (titleEl) titleEl.textContent = title;
  document.title = `${title} - NetBankX`;
}

function initNavHighlight() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.endsWith(href.replace('../', ''))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function addHashRouting(routes) {
  function handleHashChange() {
    const hash = window.location.hash || '#';
    const renderFn = routes[hash] || routes['#'];
    if (typeof renderFn === 'function') {
      renderFn();
      initNavHighlight(); // update active state based on hash if needed
    }
  }

  window.addEventListener('hashchange', handleHashChange);
  // trigger on initial load
  handleHashChange();
}
