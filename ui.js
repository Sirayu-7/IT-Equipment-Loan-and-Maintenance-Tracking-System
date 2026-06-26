// ui.js - Modern UI Components Logic

// Create global UI container if not exists
function initUI() {
  if (!document.getElementById('ui-container')) {
    const container = document.createElement('div');
    container.id = 'ui-container';
    container.innerHTML = `
      <div class="ui-overlay" id="ui-overlay">
        <div class="ui-modal" id="ui-modal">
          <div class="ui-modal-header">
            <h3 class="ui-modal-title" id="ui-modal-title">Title</h3>
            <button class="ui-modal-close" onclick="closeModal()">&times;</button>
          </div>
          <div class="ui-modal-body" id="ui-modal-body"></div>
          <div class="ui-modal-footer" id="ui-modal-footer"></div>
        </div>
      </div>
      <div class="ui-tooltip" id="ui-tooltip"></div>
      <div class="ui-popover" id="ui-popover">
        <div class="ui-popover-title" id="ui-popover-title"></div>
        <div class="ui-popover-content" id="ui-popover-content"></div>
      </div>
    `;
    document.body.appendChild(container);
  }
}

// Ensure init on load
document.addEventListener('DOMContentLoaded', initUI);
if(document.readyState === 'complete' || document.readyState === 'interactive') {
  initUI();
}

/* --- Modal & Bottom Sheet --- */
function showModal(title, bodyHTML, footerHTML = '') {
  document.getElementById('ui-modal').className = 'ui-modal'; // reset classes
  document.getElementById('ui-modal-title').innerText = title;
  document.getElementById('ui-modal-body').innerHTML = bodyHTML;
  
  const footer = document.getElementById('ui-modal-footer');
  if (footerHTML) {
    footer.innerHTML = footerHTML;
    footer.style.display = 'flex';
  } else {
    footer.style.display = 'none';
  }
  
  document.getElementById('ui-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('ui-overlay').classList.remove('active');
}

/* --- Alert Dialog --- */
function showDialog(title, message, confirmCallback) {
  document.getElementById('ui-modal').className = 'ui-modal ui-dialog';
  document.getElementById('ui-modal-title').innerText = title;
  document.getElementById('ui-modal-body').innerHTML = `<p>${message}</p>`;
  
  const footer = document.getElementById('ui-modal-footer');
  footer.innerHTML = `
    <button class="btn" style="background:var(--bg-card); color:var(--text-main); border:1px solid var(--border-color);" onclick="closeModal()">ยกเลิก (Cancel)</button>
    <button class="btn btn-blue" id="dialog-confirm-btn">ยืนยัน (Confirm)</button>
  `;
  footer.style.display = 'flex';
  
  document.getElementById('dialog-confirm-btn').onclick = () => {
    closeModal();
    if(confirmCallback) confirmCallback();
  };
  
  document.getElementById('ui-overlay').classList.add('active');
}

/* --- Popover --- */
let activePopoverElement = null;
function togglePopover(event, title, contentHTML) {
  const popover = document.getElementById('ui-popover');
  const target = event.currentTarget;
  
  if (activePopoverElement === target && popover.classList.contains('active')) {
    popover.classList.remove('active');
    activePopoverElement = null;
    return;
  }
  
  document.getElementById('ui-popover-title').innerText = title;
  document.getElementById('ui-popover-content').innerHTML = contentHTML;
  
  const rect = target.getBoundingClientRect();
  popover.style.top = (rect.bottom + window.scrollY + 10) + 'px';
  
  // Calculate left to prevent overflow
  let leftPos = rect.left + window.scrollX;
  if (leftPos + 250 > window.innerWidth) {
    leftPos = window.innerWidth - 270;
  }
  popover.style.left = leftPos + 'px';
  
  popover.classList.add('active');
  activePopoverElement = target;
  
  event.stopPropagation();
}

// Close popover when clicking outside
document.addEventListener('click', (e) => {
  const popover = document.getElementById('ui-popover');
  if (popover && popover.classList.contains('active') && !popover.contains(e.target)) {
    popover.classList.remove('active');
    activePopoverElement = null;
  }
});

/* --- Tooltip --- */
function initTooltips() {
  const tooltipElement = document.getElementById('ui-tooltip');
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    // avoid attaching multiple events
    if (el.dataset.tooltipBound) return;
    el.dataset.tooltipBound = true;
    
    el.addEventListener('mouseenter', (e) => {
      const text = el.getAttribute('data-tooltip');
      tooltipElement.innerText = text;
      
      const rect = el.getBoundingClientRect();
      tooltipElement.classList.add('show');
      
      const tooltipRect = tooltipElement.getBoundingClientRect();
      tooltipElement.style.top = (rect.top + window.scrollY - tooltipRect.height - 10) + 'px';
      tooltipElement.style.left = (rect.left + window.scrollX + (rect.width/2) - (tooltipRect.width/2)) + 'px';
    });
    
    el.addEventListener('mouseleave', () => {
      tooltipElement.classList.remove('show');
    });
  });
}
