let equipmentData = [];

async function loadEquipment() {
  const res = await fetch('api/equipment.php');
  equipmentData = await res.json();
  const list = document.getElementById('eq-list');
  list.innerHTML = '';
  
  const rows = equipmentData.map(item => {
    let badge = 'badge-available';
    let statusText = 'ว่าง';
    if (item.status === 'borrowed') { badge = 'badge-borrowed'; statusText = 'ถูกยืม'; }
    if (item.status === 'repairing') { badge = 'badge-repairing'; statusText = 'ส่งซ่อม'; }

    let actionBtn = `<button class="btn btn-blue" style="padding:4px 8px; font-size:11px; margin-right:5px;" onclick="viewEquipmentDetail(${item.asset_id})">ดูรายละเอียด</button>`;
    if (currentUser.role === 'admin') {
      actionBtn += `<button class="btn btn-red" style="padding:4px 8px; font-size:11px;" onclick="deleteEquipment(${item.asset_id})">ลบ</button>`;
    }

    return `
      <div class="table-row table-eq-grid">
        <span>${item.asset_code}</span>
        <span data-tooltip="${item.description ? item.description : 'ไม่มีรายละเอียด'}" style="cursor:help;">${item.asset_name}</span>
        <span><span class="badge ${badge}">${statusText}</span></span>
        <span>${actionBtn}</span>
      </div>`;
  });
  list.innerHTML = rows.join('');
  setTimeout(initTooltips, 100);
}

function viewEquipmentDetail(id) {
  const item = equipmentData.find(e => e.asset_id == id);
  if (!item) return;
  
  const body = `
    <div style="margin-bottom: 15px;">
      <strong>รหัสอุปกรณ์:</strong> <span style="color:var(--primary)">${item.asset_code}</span>
    </div>
    <div style="margin-bottom: 15px;">
      <strong>ชื่ออุปกรณ์:</strong> ${item.asset_name}
    </div>
    <div style="margin-bottom: 15px;">
      <strong>สถานะปัจจุบัน:</strong> ${item.status === 'available' ? 'ว่าง' : (item.status === 'borrowed' ? 'ถูกยืม' : 'ส่งซ่อม')}
    </div>
    <div style="background: rgba(0,0,0,0.1); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
      <strong>รายละเอียดเพิ่มเติม (Description):</strong>
      <p style="margin-top:8px; white-space:pre-wrap;">${item.description ? item.description : '<em style="color:var(--text-muted)">- ไม่มีข้อมูล -</em>'}</p>
    </div>
  `;
  
  showModal('รายละเอียดอุปกรณ์', body);
}

function openAddEquipmentModal() {
  const body = `
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:8px; font-weight:500; font-size:14px;">ชื่ออุปกรณ์ใหม่ <span style="color:var(--danger)">*</span></label>
      <input type="text" id="modal-eq-input" placeholder="พิมพ์ชื่ออุปกรณ์..." style="width:100%; padding:12px; border-radius:10px; border:1px solid var(--border-color); background:rgba(15,23,42,0.6); color:var(--text-main); font-family:var(--font-family);" />
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:8px; font-weight:500; font-size:14px;">รายละเอียด (Description)</label>
      <textarea id="modal-eq-desc" placeholder="เช่น ยี่ห้อ, สเปค, ซีเรียลนัมเบอร์" style="width:100%; padding:12px; border-radius:10px; border:1px solid var(--border-color); background:rgba(15,23,42,0.6); color:var(--text-main); min-height:100px; font-family:var(--font-family); resize:vertical;"></textarea>
    </div>
  `;
  const footer = `
    <button class="btn" style="background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-color);" onclick="closeModal()">ยกเลิก</button>
    <button class="btn btn-blue" onclick="submitAddEquipment()">บันทึกข้อมูล</button>
  `;
  showModal('เพิ่มอุปกรณ์ใหม่', body, footer);
}

async function submitAddEquipment() {
  const input = document.getElementById('modal-eq-input');
  const descInput = document.getElementById('modal-eq-desc');
  const name = input.value.trim();
  const description = descInput ? descInput.value.trim() : '';
  
  if(!name) return showToast('กรุณากรอกชื่ออุปกรณ์', false);
  
  const res = await fetch('api/equipment.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', name, description })
  });
  const data = await res.json();
  if(data.success) {
    showToast('เพิ่มอุปกรณ์สำเร็จ');
    closeModal();
    loadEquipment();
  } else {
    showToast('เกิดข้อผิดพลาด', false);
  }
}

function deleteEquipment(id) {
  showDialog('ยืนยันการลบ', 'คุณต้องการลบอุปกรณ์นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้', async () => {
    const res = await fetch('api/equipment.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    const data = await res.json();
    if(data.success) {
      showToast('ลบอุปกรณ์สำเร็จ');
      loadEquipment();
    } else {
      showToast('เกิดข้อผิดพลาด', false);
    }
  });
}
