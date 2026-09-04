# Landing Page Cá Nhân - Trần Bá Hộ
**Giảng viên Thiết kế Đồ họa & Công nghệ Thông tin tại Cao đẳng FPT Polytechnic**
*Designer · Web Developer · Online Business*

---

## 🌟 Giới Thiệu Dự Án

Website cá nhân kết hợp đa mục tiêu:
1. **Giới thiệu năng lực chuyên môn & uy tín nghề nghiệp** (Giảng viên FPT Polytechnic).
2. **Portfolio Thiết kế đồ họa** (Logo, Bộ nhận diện, Sự kiện, Social Media Kit).
3. **Portfolio Phát triển Website** (Landing Page, Shop E-commerce, Doanh nghiệp B2B, Web App).
4. **Giới thiệu giải pháp trọng điểm "Shop Có Web"** giúp cá nhân và chủ shop số hoá bán hàng.
5. **Giới thiệu cơ hội kinh doanh Dropshipping tinh gọn Droppii**.
6. **Thư viện hình ảnh hoạt động & Lazy-loaded YouTube video**.
7. **Chia sẻ kiến thức / Tin tức chuyên môn** (Thiết kế, Website, AI, Kinh doanh).
8. **Thu thập khách hàng tiềm năng qua Form liên hệ** có validation chuẩn và lưu trữ demo.

---

## 🛠️ Công Nghệ & Tiêu Chuẩn Kỹ Thuật

- **Ngôn ngữ cốt lõi**: HTML5 Semantic, CSS3 Vanilla (Custom Properties / Variables), JavaScript thuần (ES6+).
- **Quản lý dữ liệu**: `db.json` & `js/data.js` (hoạt động mượt mà trong cả môi trường local `file://` và Web Server HTTP).
- **Phong cách thị giác**: **Minimal + Premium + Modern**
  - Màu chủ đạo: Cam (`#f58220`) & Xanh dương điểm nhấn (`#1877f2`).
  - Nền: Trắng & Xám sáng (`#f8f9fb`).
  - Typography: Google Font **Inter**.
  - Không gradient lòe loẹt, ưu tiên khoảng trắng, đường line tinh tế và số thứ tự trực quan.
- **Tối ưu Mobile-First**:
  - Tương thích tối đa trên trình duyệt TikTok, Facebook, Safari, Chrome mobile.
  - Menu hamburger linh hoạt.
  - Floating Mobile Action Bar ở đáy màn hình (Gọi điện, Zalo, Messenger, Gửi yêu cầu; tự ẩn khi cuộn tới footer).
  - Nút bấm tối thiểu 44px - 48px chiều cao, không có lỗi tràn màn hình (horizontal scrolling).

---

## 📁 Cấu Trúc Thư Mục

```text
tranbaho/
├── index.html                  # File HTML chính cấu trúc toàn bộ landing page & SEO metadata
├── css/
│   ├── style.css               # Hệ thống design tokens, typography, layout, components
│   └── responsive.css          # Quy tắc media queries cho mobile, tablet, desktop
├── js/
│   ├── data.js                 # Dữ liệu fallback và API loader
│   └── main.js                 # Điều khiển render UI, bộ lọc filter, lightbox, lazy YouTube, form
├── assets/
│   ├── logo/
│   │   ├── logo.svg            # Logo vector nhận diện thương hiệu
│   │   └── favicon.svg         # Favicon trình duyệt
│   ├── images/                 # Hình ảnh SVG vector sắc nét cho mockup, portfolio, thư viện, tin tức
│   └── icons/                  # Các icon SVG
├── db.json                     # Cơ sở dữ liệu mẫu JSON
└── README.md                   # Tài liệu hướng dẫn sử dụng
```

---

## 🚀 Hướng Dẫn Sử Dụng & Tùy Biến

### 1. Chạy website
- **Cách 1 (Laragon / Apache Server)**: Mở trình duyệt truy cập `http://localhost/tranbaho` hoặc `http://tranbaho.test`.
- **Cách 2 (Trực tiếp)**: Mở trực tiếp file `index.html` trong bất kỳ trình duyệt nào.

### 2. Tùy biến dữ liệu trong `db.json`
Bạn có thể dễ dàng thêm hoặc chỉnh sửa các mục trong `db.json`:
- `designPortfolio`: Danh sách các dự án thiết kế và phân loại category.
- `webProjects`: Danh sách các website mẫu đã thực hiện, link demo và công nghệ.
- `services`: Nội dung các gói dịch vụ.
- `articles`: Các bài viết chia sẻ kiến thức.
- `gallery`: Ảnh hoạt động giảng dạy, workshop, sự kiện.
- `youtubeVideos`: Mã video YouTube để phát trực tiếp khi người dùng bấm xem.

---

## 📱 Kiểm Tra & Đánh Giá Chất Lượng

- ✅ **Responsive**: 375px (Mobile), 768px (Tablet), 1024px (Laptop), 1440px+ (Desktop).
- ✅ **Performance**: Tối ưu tốc độ tải tức thì, lazy load hình ảnh và video YouTube theo yêu cầu.
- ✅ **Accessibility (A11y)**: Đầy đủ nhãn `aria-*`, focus state, alt text cho hình ảnh, điều hướng bàn phím.
- ✅ **SEO On-Page**: Thẻ meta OpenGraph, Twitter Card, Canonical, cấu trúc Heading H1 -> H2 -> H3 chuẩn mực.

---
© 2026 **Trần Bá Hộ**. Made with design, code & curiosity.
