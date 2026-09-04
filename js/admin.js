/**
 * TRAN BA HO - ADMIN DASHBOARD CONTROL SCRIPT
 * Full JWT authentication, tab switching, and MongoDB Atlas CRUD operations
 */

const API_BASE = '';
let currentToken = localStorage.getItem('tbh_admin_token') || '';
let currentTab = 'overview';
let editingItemId = null;
let currentModalCollection = '';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  if (currentToken) {
    const isAuth = await verifyToken();
    if (isAuth) {
      showDashboardView();
      return;
    }
  }
  showLoginView();
}

// ==================== AUTHENTICATION ====================
async function verifyToken() {
  try {
    const res = await fetch('/api/admin/verify', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success) {
      if (data.user && data.user.username) {
        document.getElementById('current-user-display').innerText = data.user.username;
      }
      return true;
    }
  } catch (err) {
    console.error('Token verification error:', err);
  }
  return false;
}

const loginForm = document.getElementById('admin-login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = document.getElementById('login-alert');
    const submitBtn = document.getElementById('btn-login-submit');
    alertBox.style.display = 'none';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Đang đăng nhập...';

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        currentToken = data.token;
        localStorage.setItem('tbh_admin_token', currentToken);
        showDashboardView();
      } else {
        alertBox.innerText = data.message || 'Đăng nhập thất bại';
        alertBox.style.display = 'block';
      }
    } catch (err) {
      alertBox.innerText = 'Lỗi kết nối server: ' + err.message;
      alertBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '🔑 Đăng Nhập Quản Trị';
    }
  });
}

document.getElementById('btn-logout')?.addEventListener('click', () => {
  localStorage.removeItem('tbh_admin_token');
  currentToken = '';
  showLoginView();
});

function showLoginView() {
  document.getElementById('login-view').style.display = 'flex';
  document.getElementById('dashboard-view').style.display = 'none';
}

function showDashboardView() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('dashboard-view').style.display = 'flex';
  setupNavigation();
  loadOverviewStats();
  switchTab('overview');
}

// ==================== NAVIGATION & TABS ====================
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      switchTab(tab);
    });
  });
}

function switchTab(tabName) {
  currentTab = tabName;
  
  // Highlight nav button
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  // Show panel
  document.querySelectorAll('.admin-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${tabName}`);
  });

  // Load data for selected tab
  if (tabName === 'overview') {
    loadOverviewStats();
  } else if (tabName === 'contacts') {
    loadContactsTable();
  } else if (tabName === 'profile') {
    loadProfileForm();
  } else {
    loadCollectionTable(tabName);
  }
}

// ==================== OVERVIEW & STATS ====================
async function loadOverviewStats() {
  try {
    const res = await fetch('/api/db');
    const dbData = await res.json();

    if (dbData) {
      document.getElementById('stat-courses-count').innerText = (dbData.courses || []).length;
      document.getElementById('stat-design-count').innerText = (dbData.designPortfolio || []).length;
      document.getElementById('stat-articles-count').innerText = (dbData.articles || []).length;
    }

    // Load contacts count
    const resContacts = await fetch('/api/admin/contacts', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const contactsData = await resContacts.json();
    if (contactsData.success && Array.isArray(contactsData.data)) {
      const count = contactsData.data.length;
      document.getElementById('stat-leads-count').innerText = count;
      document.getElementById('badge-leads-count').innerText = count;
    }
  } catch (e) {
    console.error('Error loading stats:', e);
  }
}

// ==================== CONTACTS TABLE ====================
async function loadContactsTable() {
  const tbody = document.getElementById('table-body-contacts');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Đang tải dữ liệu...</td></tr>';

  try {
    const res = await fetch('/api/admin/contacts', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const result = await res.json();

    if (result.success && result.data.length > 0) {
      document.getElementById('badge-leads-count').innerText = result.data.length;
      tbody.innerHTML = result.data.map(item => `
        <tr>
          <td><small>${item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'N/A'}</small></td>
          <td><strong>${escapeHtml(item.fullname || 'Chưa nhập')}</strong></td>
          <td><a href="tel:${item.phone}">${escapeHtml(item.phone || '')}</a></td>
          <td>${escapeHtml(item.email || 'Không có')}</td>
          <td><span class="badge-count">${escapeHtml(item.service || 'Tư vấn')}</span></td>
          <td><small>${escapeHtml(item.message || 'Không có')}</small></td>
          <td>
            <button class="btn btn-danger btn-icon" onclick="deleteItem('contacts', '${item.id}')">🗑️ Xóa</button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có lượt liên hệ nào.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi: ${err.message}</td></tr>`;
  }
}

// ==================== GENERIC COLLECTIONS TABLE ====================
async function loadCollectionTable(collName) {
  const tbody = document.getElementById(`table-body-${collName}`);
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" class="text-center">Đang tải dữ liệu...</td></tr>';

  try {
    const res = await fetch(`/api/admin/${collName}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const result = await res.json();

    if (result.success && Array.isArray(result.data)) {
      renderTableRows(collName, result.data, tbody);
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không có bản ghi nào.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Lỗi: ${err.message}</td></tr>`;
  }
}

function renderTableRows(collName, items, tbody) {
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Danh sách trống.</td></tr>';
    return;
  }

  if (collName === 'courses') {
    tbody.innerHTML = items.map(item => `
      <tr>
        <td><img src="${item.image || 'assets/images/courses/khoahoc_design.png'}" class="tbl-thumb"></td>
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td>${escapeHtml(item.format || 'Online')}</td>
        <td><small>${(item.skills || []).join(', ')}</small></td>
        <td><span class="badge-count" style="background:#16a34a">${item.active !== false ? 'Hoạt động' : 'Ẩn'}</span></td>
        <td>
          <div class="btn-action-group">
            <button class="btn btn-outline-primary btn-icon" onclick="openCrudModal('${collName}', 'edit', '${item.id}')">✏️ Sửa</button>
            <button class="btn btn-danger btn-icon" onclick="deleteItem('${collName}', '${item.id}')">🗑️ Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');
  } else if (collName === 'designPortfolio') {
    tbody.innerHTML = items.map(item => `
      <tr>
        <td><img src="${item.image || ''}" class="tbl-thumb"></td>
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td><span class="badge-count">${escapeHtml(item.category || 'Logo')}</span></td>
        <td>${escapeHtml(item.client || '')}</td>
        <td>${item.year || '2026'}</td>
        <td>
          <div class="btn-action-group">
            <button class="btn btn-outline-primary btn-icon" onclick="openCrudModal('${collName}', 'edit', '${item.id}')">✏️ Sửa</button>
            <button class="btn btn-danger btn-icon" onclick="deleteItem('${collName}', '${item.id}')">🗑️ Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');
  } else if (collName === 'webProjects') {
    tbody.innerHTML = items.map(item => `
      <tr>
        <td><img src="${item.image || ''}" class="tbl-thumb"></td>
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td><span class="badge-count">${escapeHtml(item.category || 'Shop')}</span></td>
        <td><small>${escapeHtml(item.tech || '')}</small></td>
        <td>
          <div class="btn-action-group">
            <button class="btn btn-outline-primary btn-icon" onclick="openCrudModal('${collName}', 'edit', '${item.id}')">✏️ Sửa</button>
            <button class="btn btn-danger btn-icon" onclick="deleteItem('${collName}', '${item.id}')">🗑️ Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');
  } else if (collName === 'articles') {
    tbody.innerHTML = items.map(item => `
      <tr>
        <td><img src="${item.image || ''}" class="tbl-thumb"></td>
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td><span class="badge-count">${escapeHtml(item.category || 'Chia sẻ')}</span></td>
        <td><small>${item.date || ''}</small></td>
        <td>
          <div class="btn-action-group">
            <button class="btn btn-outline-primary btn-icon" onclick="openCrudModal('${collName}', 'edit', '${item.id}')">✏️ Sửa</button>
            <button class="btn btn-danger btn-icon" onclick="deleteItem('${collName}', '${item.id}')">🗑️ Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');
  } else if (collName === 'youtubeVideos') {
    tbody.innerHTML = items.map(item => `
      <tr>
        <td><img src="${item.thumbnail || ''}" class="tbl-thumb"></td>
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td><code>${escapeHtml(item.videoId || '')}</code></td>
        <td>${item.duration || ''}</td>
        <td><span class="badge-count">${escapeHtml(item.category || '')}</span></td>
        <td>
          <div class="btn-action-group">
            <button class="btn btn-outline-primary btn-icon" onclick="openCrudModal('${collName}', 'edit', '${item.id}')">✏️ Sửa</button>
            <button class="btn btn-danger btn-icon" onclick="deleteItem('${collName}', '${item.id}')">🗑️ Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

// ==================== PROFILE FORM ====================
async function loadProfileForm() {
  try {
    const res = await fetch('/api/admin/profile', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const result = await res.json();
    const prof = (result.data && result.data.length > 0) ? result.data[0] : result.data || {};

    document.getElementById('prof-name').value = prof.name || 'Trần Bá Hộ';
    document.getElementById('prof-role').value = prof.role || '';
    document.getElementById('prof-tagline').value = prof.tagline || '';
    document.getElementById('prof-phone').value = prof.phone || '';
    document.getElementById('prof-email').value = prof.email || '';
    document.getElementById('prof-zalo').value = prof.zalo || '';
    document.getElementById('prof-location').value = prof.location || '';
  } catch (e) {
    console.error('Error profile form:', e);
  }
}

const profileForm = document.getElementById('form-profile-update');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('prof-name').value,
      role: document.getElementById('prof-role').value,
      tagline: document.getElementById('prof-tagline').value,
      phone: document.getElementById('prof-phone').value,
      email: document.getElementById('prof-email').value,
      zalo: document.getElementById('prof-zalo').value,
      location: document.getElementById('prof-location').value
    };

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Cập nhật thông tin Profile thành công!');
      } else {
        alert('❌ Lỗi: ' + data.message);
      }
    } catch (err) {
      alert('❌ Lỗi kết nối: ' + err.message);
    }
  });
}

// ==================== CRUD MODAL LOGIC ====================
async function openCrudModal(collName, mode, itemId = null) {
  currentModalCollection = collName;
  editingItemId = itemId;

  const modal = document.getElementById('crud-modal');
  const title = document.getElementById('crud-modal-title');
  const fieldsContainer = document.getElementById('crud-modal-fields');

  title.innerText = mode === 'add' ? `➕ Thêm Bản Ghi [${collName}]` : `✏️ Chỉnh Sửa Bản Ghi`;
  fieldsContainer.innerHTML = 'Đang tải thông tin...';
  modal.classList.add('open');

  let itemData = {};
  if (mode === 'edit' && itemId) {
    try {
      const res = await fetch(`/api/admin/${collName}`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        itemData = result.data.find(i => String(i.id) === String(itemId) || String(i._id) === String(itemId)) || {};
      }
    } catch (e) {}
  }

  // Inject dynamic form fields
  fieldsContainer.innerHTML = buildFormFields(collName, itemData);
}

function closeCrudModal() {
  document.getElementById('crud-modal').classList.remove('open');
  editingItemId = null;
}

function buildFormFields(coll, data) {
  if (coll === 'courses') {
    return `
      <div class="form-group">
        <label class="form-label">Tên khóa học *</label>
        <input type="text" name="title" class="form-control" value="${escapeHtml(data.title || '')}" required>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Nhãn khóa học</label>
          <input type="text" name="label" class="form-control" value="${escapeHtml(data.label || 'Học Online')}">
        </div>
        <div class="form-group">
          <label class="form-label">Hình thức học</label>
          <input type="text" name="format" class="form-control" value="${escapeHtml(data.format || 'Google Meet')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Đường dẫn Hình ảnh (URL)</label>
        <input type="text" name="image" class="form-control" value="${escapeHtml(data.image || 'assets/images/courses/khoahoc_design.png')}">
      </div>
      <div class="form-group">
        <label class="form-label">Mô tả ngắn</label>
        <textarea name="description" class="form-control" rows="3">${escapeHtml(data.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Kỹ năng (phân cách bằng dấu phẩy)</label>
        <input type="text" name="skillsStr" class="form-control" value="${(data.skills || []).join(', ')}">
      </div>
    `;
  } else if (coll === 'designPortfolio') {
    return `
      <div class="form-group">
        <label class="form-label">Tên tác phẩm / Dự án *</label>
        <input type="text" name="title" class="form-control" value="${escapeHtml(data.title || '')}" required>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Phân loại (Logo / Sự kiện / Branding...)</label>
          <input type="text" name="category" class="form-control" value="${escapeHtml(data.category || 'Logo')}">
        </div>
        <div class="form-group">
          <label class="form-label">Năm thực hiện</label>
          <input type="text" name="year" class="form-control" value="${data.year || '2026'}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Khách hàng / Đơn vị</label>
        <input type="text" name="client" class="form-control" value="${escapeHtml(data.client || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Đường dẫn Ảnh (URL)</label>
        <input type="text" name="image" class="form-control" value="${escapeHtml(data.image || 'assets/images/design-01.svg')}">
      </div>
      <div class="form-group">
        <label class="form-label">Mô tả chi tiết</label>
        <textarea name="description" class="form-control" rows="3">${escapeHtml(data.description || '')}</textarea>
      </div>
    `;
  } else if (coll === 'webProjects') {
    return `
      <div class="form-group">
        <label class="form-label">Tên dự án Website *</label>
        <input type="text" name="title" class="form-control" value="${escapeHtml(data.title || '')}" required>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Danh mục (Shop / Landing Page...)</label>
          <input type="text" name="category" class="form-control" value="${escapeHtml(data.category || 'Shop')}">
        </div>
        <div class="form-group">
          <label class="form-label">Công nghệ ứng dụng</label>
          <input type="text" name="tech" class="form-control" value="${escapeHtml(data.tech || 'HTML5 · CSS3 · JS')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Đường dẫn Ảnh (URL)</label>
        <input type="text" name="image" class="form-control" value="${escapeHtml(data.image || 'assets/images/web-01.svg')}">
      </div>
      <div class="form-group">
        <label class="form-label">Mô tả dự án</label>
        <textarea name="description" class="form-control" rows="3">${escapeHtml(data.description || '')}</textarea>
      </div>
    `;
  } else if (coll === 'articles') {
    return `
      <div class="form-group">
        <label class="form-label">Tiêu đề bài viết *</label>
        <input type="text" name="title" class="form-control" value="${escapeHtml(data.title || '')}" required>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Chuyên mục</label>
          <input type="text" name="category" class="form-control" value="${escapeHtml(data.category || 'Thiết kế')}">
        </div>
        <div class="form-group">
          <label class="form-label">Ngày đăng</label>
          <input type="text" name="date" class="form-control" value="${data.date || new Date().toLocaleDateString('vi-VN')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Đường dẫn Ảnh đại diện (URL)</label>
        <input type="text" name="image" class="form-control" value="${escapeHtml(data.image || 'assets/images/article-01.svg')}">
      </div>
      <div class="form-group">
        <label class="form-label">Mô tả tóm tắt</label>
        <textarea name="description" class="form-control" rows="2">${escapeHtml(data.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Nội dung bài viết chi tiết</label>
        <textarea name="content" class="form-control" rows="5">${escapeHtml(data.content || '')}</textarea>
      </div>
    `;
  } else if (coll === 'youtubeVideos') {
    return `
      <div class="form-group">
        <label class="form-label">Tiêu đề Video *</label>
        <input type="text" name="title" class="form-control" value="${escapeHtml(data.title || '')}" required>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">YouTube Video ID *</label>
          <input type="text" name="videoId" class="form-control" value="${escapeHtml(data.videoId || 'dQw4w9WgXcQ')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Thời lượng (VD: 24:15)</label>
          <input type="text" name="duration" class="form-control" value="${escapeHtml(data.duration || '15:00')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Danh mục Video</label>
        <input type="text" name="category" class="form-control" value="${escapeHtml(data.category || 'UI/UX Design')}">
      </div>
      <div class="form-group">
        <label class="form-label">Mô tả ngắn Video</label>
        <textarea name="description" class="form-control" rows="3">${escapeHtml(data.description || '')}</textarea>
      </div>
    `;
  }
  return '<p>Không có mẫu form cho danh mục này.</p>';
}

const crudForm = document.getElementById('crud-modal-form');
if (crudForm) {
  crudForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(crudForm);
    const payload = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });

    if (payload.skillsStr) {
      payload.skills = payload.skillsStr.split(',').map(s => s.trim()).filter(Boolean);
      delete payload.skillsStr;
    }

    const isEdit = Boolean(editingItemId);
    const url = isEdit
      ? `/api/admin/${currentModalCollection}/${editingItemId}`
      : `/api/admin/${currentModalCollection}`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        alert(isEdit ? '✅ Đã cập nhật thành công!' : '✅ Đã thêm mới thành công!');
        closeCrudModal();
        switchTab(currentModalCollection);
      } else {
        alert('❌ Lỗi: ' + data.message);
      }
    } catch (err) {
      alert('❌ Lỗi gửi yêu cầu: ' + err.message);
    }
  });
}

// ==================== DELETE ITEM ====================
async function deleteItem(collName, itemId) {
  if (!confirm(`Bạn có chắc chắn muốn xóa bản ghi này khỏi MongoDB không?`)) return;

  try {
    const res = await fetch(`/api/admin/${collName}/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();

    if (data.success) {
      alert('✅ Đã xóa bản ghi thành công!');
      if (collName === 'contacts') {
        loadContactsTable();
        loadOverviewStats();
      } else {
        loadCollectionTable(collName);
      }
    } else {
      alert('❌ Lỗi xóa: ' + data.message);
    }
  } catch (err) {
    alert('❌ Lỗi kết nối: ' + err.message);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
