async function loadUsers() {
  const res = await fetch('api/users.php');
  const users = await res.json();
  const list = document.getElementById('user-list');
  list.innerHTML = '';
  
  const rows = users.map(u => {
    let roleText = 'User';
    if (u.role === 'admin') roleText = 'Admin';
    if (u.role === 'staff') roleText = 'Staff';

    let actionBtn = (currentUser.role === 'admin' && u.user_id !== currentUser.user_id)
      ? `<button class="btn btn-red" style="padding:4px 8px; font-size:11px;" onclick="deleteUser(${u.user_id})">Delete</button>`
      : '-';

    return `
      <div class="table-row table-users-grid">
        <span>${u.user_id}</span>
        <span>${u.username}</span>
        <span>${u.full_name}</span>
        <span>${roleText}</span>
        <span>${actionBtn}</span>
      </div>`;
  });
  list.innerHTML = rows.join('');
}

async function addUser() {
  const user = document.getElementById('user-input-username').value.trim();
  const name = document.getElementById('user-input-name').value.trim();
  const role = document.getElementById('user-role').value;
  
  if(!user || !name) return showToast('กรุณากรอกข้อมูลให้ครบถ้วน', false);
  
  const res = await fetch('api/users.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', username: user, name: name, role: role })
  });
  
  const data = await res.json();
  if(data.success) {
    showToast('เพิ่มผู้ใช้งานสำเร็จ (รหัสผ่านเริ่มต้นคือ 123)');
    document.getElementById('user-input-username').value = '';
    document.getElementById('user-input-name').value = '';
    loadUsers();
  } else {
    showToast('เกิดข้อผิดพลาด', false);
  }
}

function deleteUser(id) {
  showDialog('ยืนยันการลบ', 'คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้', async () => {
    const res = await fetch('api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    const data = await res.json();
    if (data.success) {
      showToast('ลบผู้ใช้งานสำเร็จ');
      loadUsers();
    } else {
      showToast('เกิดข้อผิดพลาด', false);
    }
  });
}
