let borrowData = [];
let borrowEquipment = [];

async function loadBorrow() {
  // Load equipment (for dropdown in modal)
  const eqRes = await fetch('api/equipment.php');
  borrowEquipment = await eqRes.json();

  // Load borrow list
  const res = await fetch('api/borrow.php');
  borrowData = await res.json();

  // Summary strip
  const pending = borrowData.filter(b => b.trans_status === 'pending').length;
  const approved = borrowData.filter(b => b.trans_status === 'approved').length;
  const returned = borrowData.filter(b => b.trans_status === 'returned').length;
  document.getElementById('borrow-summary').innerHTML = `
    <div class="borrow-sum-item"><span class="borrow-sum-num">${borrowData.length}</span><span class="borrow-sum-label">ทั้งหมด</span></div>
    <div class="borrow-sum-sep"></div>
    <div class="borrow-sum-item"><span class="borrow-sum-num" style="color:#f87171">${pending}</span><span class="borrow-sum-label">รอดำเนินการ</span></div>
    <div class="borrow-sum-sep"></div>
    <div class="borrow-sum-item"><span class="borrow-sum-num" style="color:#fbbf24">${approved}</span><span class="borrow-sum-label">กำลังยืม</span></div>
    <div class="borrow-sum-sep"></div>
    <div class="borrow-sum-item"><span class="borrow-sum-num" style="color:#34d399">${returned}</span><span class="borrow-sum-label">คืนแล้ว</span></div>
  `;

  // Render borrow cards
  const list = document.getElementById('borrow-list');
  if (borrowData.length === 0) {
    list.innerHTML = `<div class="borrow-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted)"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg><p>ยังไม่มีรายการยืม-คืน</p></div>`;
    return;
  }

  const rows = borrowData.map(b => {
    const statusMap = {
      pending: { label: 'รอดำเนินการ', cls: 'badge-repairing', color: '#f87171' },
      approved: { label: 'กำลังยืม', cls: 'badge-borrowed', color: '#fbbf24' },
      returned: { label: 'คืนแล้ว', cls: 'badge-available', color: '#34d399' }
    };
    const s = statusMap[b.trans_status] || { label: b.trans_status, cls: '', color: '#fff' };
    const date = b.borrow_date ? new Date(b.borrow_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

    let actionBtns = '';
    if (currentUser.role === 'admin' || currentUser.role === 'staff') {
      if (b.trans_status === 'pending') {
        actionBtns = `<button class="btn btn-green" style="padding:6px 14px; font-size:12px;" onclick="updateBorrowStatus(${b.trans_id}, 'approved')">✓ อนุมัติ</button>`;
      } else if (b.trans_status === 'approved') {
        actionBtns = `<button class="btn btn-blue" style="padding:6px 14px; font-size:12px;" onclick="updateBorrowStatus(${b.trans_id}, 'returned')">↩ รับคืน</button>`;
      }
    }

    return `
      <div class="borrow-card" onclick="viewBorrowDetail(${b.trans_id})" style="cursor:pointer;">
        <div class="borrow-card-accent" style="background:${s.color}"></div>
        <div class="borrow-card-inner">
          <div class="borrow-card-top">
            <span class="borrow-card-id">#${b.trans_id}</span>
            <span class="badge ${s.cls}">${s.label}</span>
          </div>
          <div class="borrow-card-asset">${b.asset_name}</div>
          <div class="borrow-card-meta">
            <span>👤 ${b.user_name}</span>
            <span>📅 ${date}</span>
          </div>
          <div class="borrow-card-detail">${b.detail || '-'}</div>
          ${actionBtns ? `<div class="borrow-card-actions" onclick="event.stopPropagation()">${actionBtns}</div>` : ''}
        </div>
      </div>`;
  });
  list.innerHTML = rows.join('');
}

function viewBorrowDetail(id) {
  const b = borrowData.find(x => x.trans_id == id);
  if (!b) return;
  const statusMap = {
    pending: { label: 'รอดำเนินการ', cls: 'badge-repairing' },
    approved: { label: 'กำลังยืม', cls: 'badge-borrowed' },
    returned: { label: 'คืนแล้ว', cls: 'badge-available' }
  };
  const s = statusMap[b.trans_status] || { label: b.trans_status, cls: '' };
  const date = b.borrow_date ? new Date(b.borrow_date).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' }) : '-';

  const body = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
      <span style="font-size:13px; color:var(--text-muted)">รหัสรายการ #${b.trans_id}</span>
      <span class="badge ${s.cls}">${s.label}</span>
    </div>
    <div style="background:rgba(0,0,0,0.12); border-radius:12px; padding:16px; margin-bottom:14px;">
      <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px;">อุปกรณ์ที่ยืม</div>
      <div style="font-size:18px; font-weight:700;">${b.asset_name}</div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
      <div style="background:rgba(0,0,0,0.08); border-radius:10px; padding:12px;">
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">ผู้ยืม</div>
        <div style="font-weight:600;">${b.user_name}</div>
      </div>
      <div style="background:rgba(0,0,0,0.08); border-radius:10px; padding:12px;">
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">วันที่ยืม</div>
        <div style="font-weight:600; font-size:13px;">${date}</div>
      </div>
    </div>
    <div style="background:rgba(0,0,0,0.08); border-radius:10px; padding:14px;">
      <div style="font-size:11px; color:var(--text-muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:.5px;">เหตุผล / รายละเอียด</div>
      <div style="white-space:pre-wrap; line-height:1.6;">${b.detail || '-'}</div>
    </div>
  `;
  showModal('รายละเอียดการยืม', body);
}

function openBorrowModal() {
  const available = borrowEquipment.filter(e => e.status === 'available');
  const options = available.length
    ? available.map(e => `<option value="${e.asset_id}">${e.asset_code} — ${e.asset_name}</option>`).join('')
    : '<option value="">ไม่มีอุปกรณ์ว่างในขณะนี้</option>';

  const body = `
    <div style="margin-bottom:16px;">
      <label style="display:block; margin-bottom:8px; font-weight:600; font-size:13px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.5px;">อุปกรณ์ที่ต้องการยืม <span style="color:var(--danger)">*</span></label>
      <select id="modal-borrow-eq" style="width:100%; padding:12px; border-radius:10px; border:1px solid var(--border-color); background:rgba(15,23,42,0.6); color:var(--text-main); font-family:var(--font-family); font-size:14px;">${options}</select>
    </div>
    <div>
      <label style="display:block; margin-bottom:8px; font-weight:600; font-size:13px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.5px;">เหตุผล / รายละเอียด <span style="color:var(--danger)">*</span></label>
      <textarea id="modal-borrow-detail" placeholder="อธิบายความจำเป็นในการขอยืมอุปกรณ์..." style="width:100%; padding:12px; border-radius:10px; border:1px solid var(--border-color); background:rgba(15,23,42,0.6); color:var(--text-main); font-family:var(--font-family); font-size:14px; min-height:110px; resize:vertical; line-height:1.6;"></textarea>
    </div>
    ${available.length === 0 ? '<div style="margin-top:12px; padding:10px 14px; background:rgba(239,68,68,0.1); border-radius:8px; border:1px solid rgba(239,68,68,0.3); font-size:13px; color:#f87171;">⚠️ ขณะนี้ไม่มีอุปกรณ์ว่าง</div>' : ''}
  `;
  const footer = `
    <button class="btn" style="background:transparent; border:1px solid var(--border-color); color:var(--text-muted);" onclick="closeModal()">ยกเลิก</button>
    <button class="btn btn-green" onclick="submitBorrow()" ${available.length === 0 ? 'disabled style="opacity:.5;cursor:not-allowed;"' : ''}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ยืนยันส่งคำร้อง
    </button>
  `;
  showModal('ส่งคำร้องยืมอุปกรณ์', body, footer);
}

async function submitBorrow() {
  const eqId = document.getElementById('modal-borrow-eq')?.value;
  const detail = document.getElementById('modal-borrow-detail')?.value.trim();
  if (!eqId || !detail) return showToast('กรุณากรอกข้อมูลให้ครบถ้วน', false);

  const res = await fetch('api/borrow.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', asset_id: eqId, detail, user_id: currentUser.user_id })
  });
  const data = await res.json();
  if (data.success) {
    closeModal();
    showToast('ส่งคำร้องยืมสำเร็จ ✓');
    loadBorrow();
  } else {
    showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', false);
  }
}

async function updateBorrowStatus(id, newStatus) {
  const label = newStatus === 'approved' ? 'อนุมัติการยืม' : 'รับคืนอุปกรณ์';
  showDialog(`ยืนยัน${label}`, `คุณต้องการ${label}รายการนี้ใช่หรือไม่?`, async () => {
    const res = await fetch('api/borrow.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', id, status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast('อัปเดตสถานะสำเร็จ ✓');
      loadBorrow();
    } else {
      showToast('เกิดข้อผิดพลาด', false);
    }
  });
}

