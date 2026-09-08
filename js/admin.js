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
      const galleryCountEl = document.getElementById('stat-gallery-count');
      if (galleryCountEl) galleryCountEl.innerText = (dbData.gallery || []).length;
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
  } else if (collName === 'gallery') {
    const sorted = [...items].sort((a, b) => {
      const timeA = parseDateToTimestamp(a.date, a.createdAt, a.id);
      const timeB = parseDateToTimestamp(b.date, b.createdAt, b.id);
      return timeB - timeA;
    });

    tbody.innerHTML = sorted.map(item => `
      <tr>
        <td><img src="${item.image || 'assets/images/gallery-01.svg'}" class="tbl-thumb" onerror="this.onerror=null; this.src='assets/images/default-video-thumbnail.svg';"></td>
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td><span class="badge-count">${escapeHtml(item.category || 'Hoạt động')}</span></td>
        <td><small>${escapeHtml(item.date || '')}</small></td>
        <td><small>${escapeHtml(item.caption || '')}</small></td>
        <td>
          <div class="btn-action-group">
            <button class="btn btn-outline-primary btn-icon" onclick="openCrudModal('${collName}', 'edit', '${item.id || item._id}')">✏️ Sửa</button>
            <button class="btn btn-danger btn-icon" onclick="deleteItem('${collName}', '${item.id || item._id}')">🗑️ Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');
  } else if (collName === 'youtubeVideos') {
    const sorted = [...items].sort((a, b) => {
      const timeA = parseDateToTimestamp(a.date, a.createdAt, a.id);
      const timeB = parseDateToTimestamp(b.date, b.createdAt, b.id);
      return timeB - timeA;
    });

    tbody.innerHTML = sorted.map(item => {
      const cleanId = extractYouTubeId(item.videoId || '');
      const thumb = (cleanId && /^[a-zA-Z0-9_-]{11}$/.test(cleanId))
        ? `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`
        : (item.thumbnail && !item.thumbnail.includes('video-0') && !item.thumbnail.endsWith('.svg') ? item.thumbnail : 'assets/images/default-video-thumbnail.svg');
      return `
      <tr>
        <td><img src="${thumb}" class="tbl-thumb" onerror="this.onerror=null; this.src='assets/images/default-video-thumbnail.svg';"></td>
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td><code>${escapeHtml(item.videoId || '')}</code></td>
        <td>${item.duration || ''}</td>
        <td><span class="badge-count">${escapeHtml(item.category || '')}</span></td>
        <td>${item.date || ''}</td>
        <td>
          <div class="btn-action-group">
            <button class="btn btn-outline-primary btn-icon" onclick="openCrudModal('${collName}', 'edit', '${item.id || item._id}')">✏️ Sửa</button>
            <button class="btn btn-danger btn-icon" onclick="deleteItem('${collName}', '${item.id || item._id}')">🗑️ Xóa</button>
          </div>
        </td>
      </tr>
      `;
    }).join('');
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
  } else if (coll === 'gallery') {
    const currentImg = data.image || 'assets/images/gallery-01.svg';
    return `
      <div class="form-group">
        <label class="form-label">Tiêu đề ảnh / Hoạt động *</label>
        <input type="text" name="title" class="form-control" value="${escapeHtml(data.title || '')}" placeholder="VD: Giờ giảng dạy Thiết kế Đồ họa..." required>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Chuyên mục</label>
          <input type="text" name="category" class="form-control" value="${escapeHtml(data.category || 'Giảng dạy')}" placeholder="VD: Giảng dạy, Workshop, Sự kiện, Dự án...">
        </div>
        <div class="form-group">
          <label class="form-label">Ngày đăng (DD/MM/YYYY)</label>
          <input type="text" name="date" class="form-control" value="${escapeHtml(data.date || new Date().toLocaleDateString('vi-VN'))}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Đường dẫn Hình ảnh (URL / Path) *</label>
        <input type="text" name="image" id="input-gallery-image" class="form-control" value="${escapeHtml(data.image || '')}" placeholder="assets/images/... hoặc link https://..." required oninput="updateGalleryImgPreview(this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Xem trước hình ảnh</label>
        <div style="display: flex; gap: 16px; align-items: center; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <img id="gallery-img-preview" src="${currentImg}" style="width: 140px; height: 95px; object-fit: cover; border-radius: 6px; background: #0f172a;" onerror="this.onerror=null; this.src='assets/images/default-video-thumbnail.svg';" />
          <div style="font-size: 0.8125rem; color: #64748b; line-height: 1.5;">
            Hỗ trợ link ảnh tĩnh trong thư mục dự án (<code>assets/images/...</code>) hoặc link ảnh trực tuyến (<code>https://...</code>).
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Chú thích / Mô tả ảnh</label>
        <textarea name="caption" class="form-control" rows="3" placeholder="Mô tả chi tiết hoặc thông điệp của bức ảnh...">${escapeHtml(data.caption || '')}</textarea>
      </div>
    `;
  } else if (coll === 'youtubeVideos') {
    const currentVideoId = data.videoId || '';
    const cleanId = extractYouTubeId(currentVideoId);
    const previewThumb = (cleanId && /^[a-zA-Z0-9_-]{11}$/.test(cleanId))
      ? `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`
      : 'assets/images/default-video-thumbnail.svg';

    return `
      <div class="form-group">
        <label class="form-label">Tiêu đề Video *</label>
        <input type="text" name="title" id="input-yt-title" class="form-control" value="${escapeHtml(data.title || '')}" required>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">YouTube Video ID hoặc URL *</label>
          <input type="text" name="videoId" id="input-yt-videoid" class="form-control" value="${escapeHtml(data.videoId || '')}" placeholder="VD: 86Oajh8whQU hoặc https://youtu.be/..." required oninput="updateYtThumbPreview(this.value)">
          <div id="yt-fetch-status" style="font-size: 0.8125rem; margin-top: 6px; min-height: 18px;"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Thời lượng (Tự động tải)</label>
          <div style="position: relative;">
            <input type="text" name="duration" id="input-yt-duration" class="form-control" value="${escapeHtml(data.duration || '')}" placeholder="VD: 06:26">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Xem trước Ảnh Thumbnail YouTube</label>
        <div style="display: flex; gap: 16px; align-items: center; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <img id="yt-thumb-preview" src="${previewThumb}" style="width: 150px; aspect-ratio: 16/9; object-fit: cover; border-radius: 6px; background: #0f172a;" onerror="this.onerror=null; this.src='assets/images/default-video-thumbnail.svg';" />
          <div style="font-size: 0.8125rem; color: #64748b; line-height: 1.5;">
            Tự động tải thumbnail gốc từ YouTube (<code>hqdefault.jpg</code>) và tự động nhận diện thời lượng video.<br>
            Nếu không tải được hoặc video chưa tồn tại, hệ thống sẽ tự động hiển thị ảnh thumbnail mặc định.
          </div>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Danh mục Video</label>
          <input type="text" name="category" class="form-control" value="${escapeHtml(data.category || 'UI/UX Design')}">
        </div>
        <div class="form-group">
          <label class="form-label">Ngày đăng (DD/MM/YYYY)</label>
          <input type="text" name="date" class="form-control" value="${escapeHtml(data.date || new Date().toLocaleDateString('vi-VN'))}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Mô tả ngắn Video</label>
        <textarea name="description" class="form-control" rows="3">${escapeHtml(data.description || '')}</textarea>
      </div>
    `;
  }
  return '<p>Không có mẫu form cho danh mục này.</p>';
}

function updateGalleryImgPreview(val) {
  const previewImg = document.getElementById('gallery-img-preview');
  if (previewImg) {
    if (val && val.trim()) {
      previewImg.src = val.trim();
    } else {
      previewImg.src = 'assets/images/gallery-01.svg';
    }
  }
}

let ytFetchDebounceTimer = null;

function updateYtThumbPreview(val) {
  const previewImg = document.getElementById('yt-thumb-preview');
  const durationInput = document.getElementById('input-yt-duration');
  const titleInput = document.getElementById('input-yt-title');
  const statusEl = document.getElementById('yt-fetch-status');

  const cleanId = extractYouTubeId(val);

  if (cleanId && /^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
    if (previewImg) previewImg.src = `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;
    if (statusEl) {
      statusEl.innerHTML = '<span style="color: #0284c7;">⏳ Đang tự động lấy thời lượng video...</span>';
    }

    clearTimeout(ytFetchDebounceTimer);
    ytFetchDebounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/youtube-info?v=${cleanId}`);
        const result = await res.json();
        if (result && result.success) {
          if (result.duration && durationInput) {
            durationInput.value = result.duration;
          }
          if (result.title && titleInput && (!titleInput.value || titleInput.value.trim() === '')) {
            titleInput.value = result.title;
          }
          if (statusEl) {
            statusEl.innerHTML = `<span style="color: #16a34a; font-weight: 600;">✅ Đã nhận diện thời lượng: <strong>${result.duration || 'N/A'}</strong></span>`;
          }
        } else {
          if (statusEl) {
            statusEl.innerHTML = '<span style="color: #64748b;">(Không tải được thời lượng tự động, có thể nhập thủ công)</span>';
          }
        }
      } catch (err) {
        if (statusEl) {
          statusEl.innerHTML = '<span style="color: #64748b;">(Không thể kết nối máy chủ để lấy thời lượng)</span>';
        }
      }
    }, 350);
  } else {
    if (previewImg) previewImg.src = 'assets/images/default-video-thumbnail.svg';
    if (statusEl) statusEl.innerHTML = '';
  }
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

    if (currentModalCollection === 'youtubeVideos') {
      const cleanId = extractYouTubeId(payload.videoId);
      if (cleanId) {
        payload.videoId = cleanId;
        payload.thumbnail = `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;
      }
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

function extractYouTubeId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return '';
  const str = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
  if (match && match[1]) {
    return match[1];
  }
  const paramMatch = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (paramMatch && paramMatch[1]) {
    return paramMatch[1];
  }
  return str;
}

function parseDateToTimestamp(dateStr, createdAt, id) {
  if (dateStr) {
    const parts = String(dateStr).trim().split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) return parsed;
  }
  if (createdAt) {
    const parsed = Date.parse(createdAt);
    if (!isNaN(parsed)) return parsed;
  }
  return typeof id === 'number' ? id * 1000 : 0;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
