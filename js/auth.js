// auth.js

function login(userId, password, expectedRole) {
  let foundUser = null;
  let userRole = null;

  // Search all user arrays in MOCK_DATA
  const users = window.MOCK_DATA.users;
  
  if (expectedRole && users[expectedRole]) {
    foundUser = users[expectedRole].find(u => u.id === userId && u.password === password);
    if (foundUser) userRole = expectedRole;
  } else {
    for (const [role, roleUsers] of Object.entries(users)) {
      const user = roleUsers.find(u => u.id === userId && u.password === password);
      if (user) {
        foundUser = user;
        userRole = role;
        break;
      }
    }
  }

  if (foundUser) {
    sessionStorage.setItem('nbx_session', JSON.stringify({
      user: foundUser,
      role: userRole,
      loginTime: new Date().toISOString()
    }));

    const redirectUrl = `./${userRole}/dashboard.html`;
    return { success: true, user: foundUser, role: userRole, redirectUrl };
  }

  return { success: false, error: 'Invalid credentials' };
}

function logout() {
  sessionStorage.removeItem('nbx_session');
  const currentPath = window.location.pathname;
  let loginPath = '../login.html';
  if (!currentPath.includes('/hq/') && !currentPath.includes('/regional/') &&
      !currentPath.includes('/branch/') && !currentPath.includes('/customer/')) {
    loginPath = 'pages/login.html';
  }
  window.location.href = loginPath;
}

function getSession() {
  const s = sessionStorage.getItem('nbx_session');
  return s ? JSON.parse(s) : null;
}

function requireAuth(allowedRoles) {
  const session = getSession();
  
  // Calculate relative path to login page based on current URL depth
  const currentPath = window.location.pathname;
  let loginPath = 'pages/login.html';
  if (currentPath.includes('/pages/')) {
    const parts = currentPath.split('/');
    const pagesIndex = parts.indexOf('pages');
    const depth = parts.length - pagesIndex - 2; // -1 for filename, -1 for pages dir itself
    loginPath = '../'.repeat(Math.max(0, depth)) + 'login.html';
  }

  if (!session) {
    window.location.href = loginPath;
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    // Redirect to their proper dashboard — from pages/X/ go up to pages/ then into correct folder
    let dashPath = `../${session.role}/dashboard.html`;
    window.location.href = dashPath;
    return null;
  }

  return session;
}

function getCurrentUser() {
  return getSession()?.user;
}

function getCurrentRole() {
  return getSession()?.role;
}
