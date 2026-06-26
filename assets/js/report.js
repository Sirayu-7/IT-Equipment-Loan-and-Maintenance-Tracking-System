async function renderReport(type) {
  const placeholder = document.getElementById('report-placeholder');
  const content = document.getElementById('report-content');
  const statsEl = document.getElementById('report-stats');
  const cardsEl = document.getElementById('report-cards');

  // Highlight active button
  document.querySelectorAll('.report-type-btn').forEach(b => b.classList.remove('active-report-btn'));
  document.getElementById(`btn-report-${type}`).classList.add('active-report-btn');

  // Show loading state
  placeholder.style.display = 'none';
  content.style.display = 'block';
  cardsEl.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">กำลังโหลดข้อมูล...</div>';
  statsEl.innerHTML = '';

  if (type === 'borrows') {
    document.getElementById('report-title').textContent = 'รายงานการยืม-คืนอุปกรณ์';

    const res = await fetch('api/borrow.php');
    const data = await res.json();

    document.getElementById('report-subtitle').textContent = `ข้อมูลทั้งหมด ${data.length} รายการ | สร้างเมื่อ ${new Date().toLocaleString('th-TH')}`;

    const pending = data.filter(d => d.trans_status === 'pending').length;
    const approved = data.filter(d => d.trans_status === 'approved').length;
    const returned = data.filter(d => d.trans_status === 'returned').length;

    statsEl.innerHTML = `
      <div class="report-stat-box">
        <span class="report-stat-num" style="color:var(--primary)">${data.length}</span>
        <span class="report-stat-label">ทั้งหมด</span>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-num" style="color:#f87171">${pending}</span>
        <span class="report-stat-label">รอดำเนินการ</span>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-num" style="color:#fbbf24">${approved}</span>
        <span class="report-stat-label">กำลังยืม</span>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-num" style="color:#34d399">${returned}</span>
        <span class="report-stat-label">คืนแล้ว</span>
      </div>`;

    const statusMap = {
      pending: { label: 'รอดำเนินการ', cls: 'badge-repairing' },
      approved: { label: 'กำลังยืม', cls: 'badge-borrowed' },
      returned: { label: 'คืนแล้ว', cls: 'badge-available' }
    };

    const rows = data.map(d => {
      const s = statusMap[d.trans_status] || { label: d.trans_status, cls: '' };
      const date = new Date(d.borrow_date).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
      return `
        <div class="report-card">
          <div class="report-card-id">#${d.trans_id}</div>
          <div class="report-card-body">
            <div class="report-card-row">
              <span class="report-card-key">ผู้ยืม</span>
              <span class="report-card-val">${d.user_name}</span>
            </div>
            <div class="report-card-row">
              <span class="report-card-key">อุปกรณ์</span>
              <span class="report-card-val">${d.asset_name}</span>
            </div>
            <div class="report-card-row">
              <span class="report-card-key">รายละเอียด</span>
              <span class="report-card-val">${d.detail || '-'}</span>
            </div>
            <div class="report-card-row">
              <span class="report-card-key">วันที่ยืม</span>
              <span class="report-card-val">${date}</span>
            </div>
          </div>
          <div class="report-card-status">
            <span class="badge ${s.cls}">${s.label}</span>
          </div>
        </div>`;
    });
    cardsEl.innerHTML = rows.join('');

  } else if (type === 'repairs') {
    document.getElementById('report-title').textContent = 'รายงานการแจ้งซ่อมอุปกรณ์';

    const res = await fetch('api/repair.php');
    const data = await res.json();

    document.getElementById('report-subtitle').textContent = `ข้อมูลทั้งหมด ${data.length} รายการ | สร้างเมื่อ ${new Date().toLocaleString('th-TH')}`;

    const pending = data.filter(d => d.repair_status === 'pending').length;
    const fixed = data.filter(d => d.repair_status === 'fixed').length;

    statsEl.innerHTML = `
      <div class="report-stat-box">
        <span class="report-stat-num" style="color:var(--primary)">${data.length}</span>
        <span class="report-stat-label">ทั้งหมด</span>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-num" style="color:#f87171">${pending}</span>
        <span class="report-stat-label">กำลังซ่อม</span>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-num" style="color:#34d399">${fixed}</span>
        <span class="report-stat-label">ซ่อมเสร็จแล้ว</span>
      </div>`;

    const rows = data.map(d => {
      const isPending = d.repair_status === 'pending';
      const statusLabel = isPending ? 'กำลังซ่อม' : 'ซ่อมเสร็จแล้ว';
      const statusCls = isPending ? 'badge-repairing' : 'badge-fixed';
      const date = new Date(d.report_date).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
      return `
        <div class="report-card">
          <div class="report-card-id">#RP-${d.repair_id}</div>
          <div class="report-card-body">
            <div class="report-card-row">
              <span class="report-card-key">ผู้แจ้งซ่อม</span>
              <span class="report-card-val">${d.user_name}</span>
            </div>
            <div class="report-card-row">
              <span class="report-card-key">อุปกรณ์</span>
              <span class="report-card-val">${d.asset_name}</span>
            </div>
            <div class="report-card-row">
              <span class="report-card-key">อาการเสีย</span>
              <span class="report-card-val">${d.detail}</span>
            </div>
            <div class="report-card-row">
              <span class="report-card-key">วันที่แจ้ง</span>
              <span class="report-card-val">${date}</span>
            </div>
          </div>
          <div class="report-card-status">
            <span class="badge ${statusCls}">${statusLabel}</span>
          </div>
        </div>`;
    });
    cardsEl.innerHTML = rows.join('');
  }
}
