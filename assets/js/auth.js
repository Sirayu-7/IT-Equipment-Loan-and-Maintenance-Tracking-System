let currentUser = null;

function showToast(msg, isSuccess = true) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (isSuccess ? '' : 'error');
  setTimeout(() => t.classList.remove('show'), 3000);
}

async function checkAuth() {
  try {
    const res = await fetch('api/login.php');
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      showApp();
    } else {
      showLogin();
    }
  } catch (err) {
    showLogin();
  }
}

async function handleLogin() {
  const u = document.getElementById('login-user').value;
  const p = document.getElementById('login-pass').value;
  
  if(!u || !p) {
    showToast('กรุณากรอก Username และ Password', false);
    return;
  }
  
  try {
    const res = await fetch('api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    
    if(data.success) {
      currentUser = data.user;
      showToast('เข้าสู่ระบบสำเร็จ');
      showApp();
    } else {
      showToast('รหัสผ่านหรือผู้ใช้งานไม่ถูกต้อง', false);
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', false);
  }
}

async function handleLogout() {
  await fetch('api/logout.php');
  currentUser = null;
  showLogin();
}

function showLogin() {
  document.getElementById('page-login').style.display = 'flex';
  document.getElementById('app-wrapper').style.display = 'none';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

function showApp() {
  document.getElementById('page-login').style.display = 'none';
  document.getElementById('app-wrapper').style.display = 'block';
  document.getElementById('current-user-display').textContent = 'สวัสดี, ' + currentUser.full_name;
  
  // Role based UI setup
  const role = currentUser.role;
  document.querySelectorAll('.nav-tab').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.role-admin-only').forEach(el => el.style.display = 'none');
  
  document.querySelectorAll('.role-all').forEach(el => el.style.display = 'block');
  if(role === 'admin') {
    document.querySelectorAll('.role-admin').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.role-admin-only').forEach(el => el.style.display = 'flex'); // input group
  } else if (role === 'staff') {
    document.querySelectorAll('.role-staff').forEach(el => el.style.display = 'block');
  }
  
  // default page
  if(role === 'admin' || role === 'staff') showPage('dashboard');
  else showPage('borrow');
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  
  const page = document.getElementById('page-' + pageId);
  if(page) page.classList.add('active');
  
  const tab = document.querySelector(`.nav-tab[data-page="${pageId}"]`);
  if (tab) tab.classList.add('active');

  // Load page specific data
  if(pageId === 'dashboard') loadDashboard();
  if(pageId === 'equipment') loadEquipment();
  if(pageId === 'users') loadUsers();
  if(pageId === 'borrow') loadBorrow();
  if(pageId === 'repair') loadRepair();
}
