let borrowChartObj = null;
let statusChartObj = null;

async function loadDashboard() {
  try {
    const res = await fetch('api/dashboard.php');
    const data = await res.json();

    if (data.success) {
      document.getElementById('dash-eq-count').textContent = data.counts.equipment;
      document.getElementById('dash-user-count').textContent = data.counts.users;

      const pendingBorrows = data.status_counts.active_borrows;
      const pendingRepairs = data.status_counts.pending_repairs;

      document.getElementById('dash-borrow-count').textContent = pendingBorrows;
      document.getElementById('dash-repair-count').textContent = pendingRepairs;

      // Grouped bar chart — borrow, return, and repair requests (last 7 days)
      const borrowData = {
        labels: [],
        datasets: [
          {
            label: 'ยืม',
            data: [],
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 36
          },
          {
            label: 'คืน',
            data: [],
            backgroundColor: 'rgba(251, 191, 36, 0.85)',
            borderColor: 'rgba(251, 191, 36, 1)',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 36
          },
          {
            label: 'แจ้งซ่อม',
            data: [],
            backgroundColor: 'rgba(248, 113, 113, 0.85)',
            borderColor: 'rgba(248, 113, 113, 1)',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 36
          }
        ]
      };

      data.borrow_stats.forEach(row => {
        const d = new Date(row.date + 'T00:00:00');
        borrowData.labels.push(d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }));
        borrowData.datasets[0].data.push(row.borrow);
        borrowData.datasets[1].data.push(row.return);
        borrowData.datasets[2].data.push(row.repair || 0);
      });

      const ctxBorrow = document.getElementById('borrowChart').getContext('2d');
      if (borrowChartObj) borrowChartObj.destroy();
      borrowChartObj = new Chart(ctxBorrow, {
        type: 'bar',
        data: borrowData,
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: '#f8fafc' } },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} รายการ`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: '#94a3b8', stepSize: 1 },
              grid: { color: 'rgba(255,255,255,0.1)' }
            },
            x: {
              ticks: { color: '#94a3b8' },
              grid: { display: false }
            }
          }
        }
      });

      // Pie chart — active borrows vs pending repairs
      const statusData = {
        labels: [
          'กำลังยืมอยู่ (Pending/Approved)',
          'รอซ่อม (Pending)'
        ],
        datasets: [{
          data: [pendingBorrows, pendingRepairs],
          backgroundColor: [
            'rgba(52, 211, 153, 0.85)',
            'rgba(248, 113, 113, 0.85)'
          ],
          borderColor: [
            'rgba(52, 211, 153, 1)',
            'rgba(248, 113, 113, 1)'
          ],
          borderWidth: 2
        }]
      };

      const ctxStatus = document.getElementById('repairChart').getContext('2d');
      if (statusChartObj) statusChartObj.destroy();
      statusChartObj = new Chart(ctxStatus, {
        type: 'pie',
        data: statusData,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#f8fafc', padding: 16, font: { size: 12 } }
            },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = total ? Math.round((ctx.parsed / total) * 100) : 0;
                  return ` ${ctx.label}: ${ctx.parsed} รายการ (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }
  } catch (err) {
    console.error('Dashboard Load Error:', err);
  }
}
