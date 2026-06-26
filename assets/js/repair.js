let repairData = [];

async function loadRepair() {
  // Load eq dropdown
  const eqRes = await fetch('api/equipment.php');
  const eq = await eqRes.json();
  const select = document.getElementById('repair-eq');
  if (!Array.isArray(eq) || eq.length === 0) {
    select.innerHTML = '<option value="">-- ไม่มีอุปกรณ์ในระบบ --</option>';
  } else {
    select.innerHTML = '<option value="">-- เลือกอุปกรณ์ --</option>' + eq
      .map(e => `<option value="${e.asset_id}">${e.asset_code} - ${e.asset_name}</option>`)
      .join('');
  }

  // Load list
  const res = await fetch('api/repair.php');
  repairData = await res.json();
  const list = document.getElementById('repair-list');

  const rows = repairData.map(r => {
    let actionBtn = `<button class="btn btn-blue" style="padding:4px 8px; font-size:11px; margin-right:5px;" onclick="viewRepairDetail(${r.repair_id})">ดูรายละเอียด</button>`;

    if (currentUser.role === 'admin' || currentUser.role === 'staff') {
      if (r.repair_status === 'pending') {
        actionBtn += `<button class="btn btn-green" style="padding:4px 8px; font-size:11px;" onclick="updateRepairStatus(${r.repair_id}, 'fixed')">ซ่อมเสร็จ</button>`;
      }
    }

    let statBadge = '';
    if (r.repair_status === 'pending') statBadge = '<span class="badge badge-repairing">กำลังซ่อม</span>';
    if (r.repair_status === 'fixed') statBadge = '<span class="badge badge-fixed">ซ่อมเสร็จแล้ว</span>';

    const shortDetail = r.detail.length > 20 ? r.detail.substring(0, 20) + '...' : r.detail;

    return `
      <div class="table-row table-repair-grid">
        <span>${r.repair_id}</span>
        <span>${r.user_name}</span>
        <span>${r.asset_name}</span>
        <span data-tooltip="${r.detail}" style="cursor:help;">${shortDetail}</span>
        <span>${statBadge}</span>
        <span>${actionBtn}</span>
      </div>`;
  });
  list.innerHTML = rows.join('');

  setTimeout(initTooltips, 100);
}

function viewRepairDetail(id) {
  const item = repairData.find(r => r.repair_id == id);
  if (!item) return;

  const body = `
    <div style="margin-bottom: 12px;"><strong>รหัสการแจ้งซ่อม:</strong> RP-${item.repair_id}</div>
    <div style="margin-bottom: 12px;"><strong>ผู้แจ้งซ่อม:</strong> ${item.user_name}</div>
    <div style="margin-bottom: 12px;"><strong>อุปกรณ์ที่เสีย:</strong> ${item.asset_name}</div>
    <div style="margin-bottom: 12px;">
      <strong>วันที่แจ้ง:</strong> ${new Date(item.report_date).toLocaleString('th-TH')}
    </div>
    <div style="margin-bottom: 15px;">
      <strong>สถานะการซ่อม:</strong> 
      ${item.repair_status === 'pending' ? '<span style="color:var(--danger);font-weight:600;">กำลังซ่อม</span>' : '<span style="color:var(--success);font-weight:600;">ซ่อมเสร็จแล้ว</span>'}
    </div>
    <div style="background: rgba(0,0,0,0.1); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
      <strong>อาการเสีย / ตำแหน่งที่ตั้ง:</strong>
      <p style="margin-top:8px; white-space:pre-wrap;">${item.detail}</p>
    </div>
  `;

  showModal('รายละเอียดการแจ้งซ่อม', body);
}

async function saveRepair() {
  const eqId = document.getElementById('repair-eq').value;
  const detail = document.getElementById('repair-detail').value.trim();

  if (!eqId || !detail) return showToast('กรุณาระบุข้อมูลให้ครบ', false);

  const res = await fetch('api/repair.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', asset_id: eqId, detail: detail, user_id: currentUser.user_id })
  });
  const data = await res.json();

  if (data.success) {
    showToast('แจ้งซ่อมสำเร็จ');
    document.getElementById('repair-detail').value = '';
    loadRepair();
  } else {
    showToast('เกิดข้อผิดพลาด', false);
  }
}

async function updateRepairStatus(id, newStatus) {
  const statusLabel = newStatus === 'fixed' ? 'ซ่อมเสร็จแล้ว' : newStatus;
  showDialog('ยืนยันการเปลี่ยนสถานะ', `คุณต้องการเปลี่ยนสถานะเป็น "${statusLabel}" ใช่หรือไม่?`, async () => {
    const res = await fetch('api/repair.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', id, status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast('อัปเดตสถานะการซ่อมสำเร็จ');
      loadRepair();
    } else {
      showToast('เกิดข้อผิดพลาด', false);
    }
  });
}
