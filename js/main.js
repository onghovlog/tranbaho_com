/**
 * TRAN BA HO - PERSONAL LANDING PAGE MAIN JAVASCRIPT
 * Pure Vanilla JS, Zero Dependencies
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Load data from db.json or fallback
  const data = await window.loadAppData();
  
  // 2. Initialize Core Modules
  initHeaderAndNav();
  initHeroSlider(data.heroSlides);
  initCourses(data.courses);
  initDesignPortfolio(data.designPortfolio);
  initWebProjects(data.webProjects);
  initLibrary(data.gallery, data.youtubeVideos);
  initArticles(data.articles);
  initContactForm();
  initFloatingMobileBar();
  initScrollAnimations();
  initModalSystem();
});

/* ==========================================================================
   COURSES / KHAI GIẢNG MODULE (HORIZONTAL SCROLL & DIRECT FORM LINK)
   ========================================================================== */
function initCourses(courses = []) {
  const track = document.getElementById('courses-track');
  const scrollContainer = document.getElementById('courses-scroll-container');
  const prevBtn = document.getElementById('courses-prev-btn');
  const nextBtn = document.getElementById('courses-next-btn');

  if (!track || !courses || courses.length === 0) return;

  const activeCourses = courses.filter(c => c.active !== false);

  track.innerHTML = activeCourses.map(course => `
    <article class="course-card fade-up-element in-view" data-course-id="${course.id}" data-slug="${course.slug || ''}">
      <div class="course-thumb-box">
        <img src="${course.image}" alt="${course.title}" class="course-thumb-img" loading="lazy" />
        <span class="course-badge-pill">${course.label || 'Học Online'}</span>
        ${course.format ? `<span class="course-format-pill">🎯 ${course.format}</span>` : ''}
      </div>
      <div class="course-body">
        <h3 class="course-title">${course.title}</h3>
        <p class="course-desc">${course.description}</p>
        <div class="course-skills">
          ${(course.skills || []).map(skill => `<span class="course-skill-tag">${skill}</span>`).join('')}
        </div>
        <a href="#lien-he" class="btn btn-outline-primary btn-sm course-cta-btn" data-course-title="${course.title}">
          Liên hệ tư vấn →
        </a>
      </div>
    </article>
  `).join('');

  // Wire up CTA buttons to pre-fill the contact form
  track.querySelectorAll('.course-cta-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseTitle = btn.dataset.courseTitle;
      const serviceSelect = document.getElementById('service-interest');
      const messageTextarea = document.getElementById('message');
      const fullnameInput = document.getElementById('fullname');

      if (serviceSelect && courseTitle) {
        const exactOptionVal = `Khóa học: ${courseTitle}`;
        let matched = false;
        for (let i = 0; i < serviceSelect.options.length; i++) {
          if (serviceSelect.options[i].value === exactOptionVal || serviceSelect.options[i].text.includes(courseTitle)) {
            serviceSelect.selectedIndex = i;
            matched = true;
            break;
          }
        }
        if (!matched) {
          const opt = new Option(`Khóa học: ${courseTitle}`, `Khóa học: ${courseTitle}`, true, true);
          serviceSelect.add(opt);
        }
      }

      if (messageTextarea && courseTitle) {
        messageTextarea.value = `Tôi quan tâm khóa học: ${courseTitle}. Vui lòng tư vấn thông tin lịch học và hỗ trợ chi tiết giúp tôi!`;
      }

      setTimeout(() => {
        if (fullnameInput) fullnameInput.focus();
      }, 600);
    });
  });

  // Wire up Horizontal Scroll Controls for Desktop
  if (scrollContainer && prevBtn && nextBtn) {
    function updateArrowButtons() {
      const scrollLeft = scrollContainer.scrollLeft;
      const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      prevBtn.disabled = scrollLeft <= 8;
      nextBtn.disabled = scrollLeft >= maxScrollLeft - 8;
    }

    prevBtn.addEventListener('click', () => {
      const cardWidth = scrollContainer.querySelector('.course-card')?.offsetWidth || 350;
      scrollContainer.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      const cardWidth = scrollContainer.querySelector('.course-card')?.offsetWidth || 350;
      scrollContainer.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
    });

    scrollContainer.addEventListener('scroll', updateArrowButtons, { passive: true });
    window.addEventListener('resize', updateArrowButtons, { passive: true });
    setTimeout(updateArrowButtons, 200);
  }
}

/* ==========================================================================
   HERO BANNER SLIDER MODULE (AUTOPLAY 2S, THEMES, VIDEO, SIDE ARROWS)
   ========================================================================== */
function initHeroSlider(slides = []) {
  const track = document.getElementById('hero-carousel-track');
  const dotsContainer = document.getElementById('hero-dots');
  const prevBtn = document.getElementById('hero-prev-btn');
  const nextBtn = document.getElementById('hero-next-btn');
  const wrapper = document.getElementById('hero-slider-wrapper');

  if (!track || !slides || slides.length === 0) return;

  // Render slides dynamically
  track.innerHTML = slides.map(slide => {
    const rightVisualHtml = `
      <div class="hero-visual">
        <div class="hero-visual-card">
          <img src="${slide.image || 'assets/images/01_ban_kinh_doanh_can_lam_web.png'}" alt="${slide.imageAlt || ''}" class="hero-visual-img" width="700" height="520" loading="eager" />
        </div>
      </div>
    `;

    const rolesHtml = slide.roles && slide.roles.length > 0 ? `
      <div class="hero-roles">
        ${slide.roles.map(r => `<span class="role-tag">${r}</span>`).join('')}
      </div>
    ` : '';

    return `
      <div class="hero-slide-item">
        <div class="container">
          <div class="hero-grid">
            <div class="hero-content">
              ${slide.badge ? `
                <div class="hero-meta-badge">
                  <span class="dot"></span>
                  <span>${slide.badge}</span>
                </div>
              ` : ''}
              
              <h1 class="hero-headline">
                ${slide.title}
              </h1>

              <p class="hero-subheadline">
                ${slide.description}
              </p>

              <div class="hero-ctas">
                ${slide.primaryBtn ? `<a href="${slide.primaryBtn.link}" class="btn btn-primary btn-lg">${slide.primaryBtn.text}</a>` : ''}
                ${slide.secondaryBtn ? `<a href="${slide.secondaryBtn.link}" class="btn btn-outline btn-lg">${slide.secondaryBtn.text}</a>` : ''}
              </div>

              ${rolesHtml}
            </div>

            ${rightVisualHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach video click listeners if any video in hero slides
  track.querySelectorAll('.hero-video-card').forEach(videoCard => {
    videoCard.addEventListener('click', () => {
      const videoId = videoCard.dataset.videoId;
      const title = videoCard.dataset.videoTitle;
      if (typeof openVideoModal === 'function') {
        openVideoModal(videoId, title);
      }
    });
    videoCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        videoCard.click();
      }
    });
  });

  let currentSlide = 0;
  const slidesCount = slides.length;
  const AUTOPLAY_DELAY = 5000; // 5 seconds autoplay as requested
  let autoplayTimer = null;

  function goToSlide(index) {
    if (index < 0) {
      currentSlide = slidesCount - 1;
    } else if (index >= slidesCount) {
      currentSlide = 0;
    } else {
      currentSlide = index;
    }

    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    // Update Dots
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.hero-dot-btn');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlide);
      });
    }
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, AUTOPLAY_DELAY);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  // Build Dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < slidesCount; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `hero-dot-btn ${i === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Chuyển tới slide ${i + 1}`);
      dot.addEventListener('click', () => {
        goToSlide(i);
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToSlide(currentSlide - 1);
      resetAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToSlide(currentSlide + 1);
      resetAutoplay();
    });
  }

  // Pause on hover
  if (wrapper) {
    wrapper.addEventListener('mouseenter', stopAutoplay);
    wrapper.addEventListener('mouseleave', startAutoplay);
  }

  // Touch Swipe Support for Mobile
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diffX = touchStartX - touchEndX;
    if (Math.abs(diffX) > 45) {
      if (diffX > 0) {
        goToSlide(currentSlide + 1);
      } else {
        goToSlide(currentSlide - 1);
      }
    }
    startAutoplay();
  }, { passive: true });

  goToSlide(0);
  startAutoplay();
}

/* ==========================================================================
   NAVIGATION, STICKY HEADER & SCROLLSPY
   ========================================================================== */
function initHeaderAndNav() {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const headerNav = document.querySelector('.header-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  // Sticky Header on Scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  // Mobile Menu Toggle
  if (menuToggle && headerNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = headerNav.classList.toggle('open');
      menuToggle.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking nav link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        headerNav.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', false);
      });
    });
  }

  // ScrollSpy Active Nav Link
  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPosition = window.scrollY + 120;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

/* ==========================================================================
   DESIGN PORTFOLIO MODULE & FILTER (SLIDER CAROUSEL - 6 BOXES PER SLIDE)
   ========================================================================== */
function initDesignPortfolio(items = []) {
  const track = document.getElementById('design-portfolio-track') || document.getElementById('design-portfolio-grid');
  const dotsContainer = document.getElementById('portfolio-slider-dots');
  const prevBtn = document.getElementById('portfolio-prev-btn');
  const nextBtn = document.getElementById('portfolio-next-btn');
  const filterButtons = document.querySelectorAll('[data-filter-design]');

  if (!track) return;

  function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks.length > 0 ? chunks : [[]];
  }

  let currentSlide = 0;
  let slidesCount = 0;

  function goToSlide(index) {
    if (index < 0) index = 0;
    if (index >= slidesCount) index = slidesCount - 1;
    currentSlide = index;

    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    // Update Dots
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.slider-dot-btn');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlide);
      });
    }

    // Update Prev / Next buttons
    if (prevBtn) prevBtn.disabled = currentSlide === 0;
    if (nextBtn) nextBtn.disabled = currentSlide === slidesCount - 1;
  }

  function render(filter = 'all') {
    const rawFilter = (filter || 'all').toLowerCase().trim();
    const filtered = (rawFilter === 'all') 
      ? items 
      : items.filter(item => {
          const cat = (item.category || '').toLowerCase().trim();
          const tags = Array.isArray(item.tags) ? item.tags.map(t => t.toLowerCase().trim()) : [];
          
          if (cat === rawFilter) return true;
          if (tags.includes(rawFilter)) return true;
          
          if (rawFilter === 'sự kiện' || rawFilter === 'su kien' || rawFilter === 'event') {
            return cat.includes('sự kiện') || cat.includes('event') || tags.some(t => t.includes('sự kiện') || t.includes('event') || t.includes('key visual') || t.includes('poster'));
          }
          if (rawFilter === 'social' || rawFilter === 'social media') {
            return cat.includes('social') || tags.some(t => t.includes('social') || t.includes('post') || t.includes('feed') || t.includes('story'));
          }
          if (rawFilter === 'branding' || rawFilter === 'thương hiệu') {
            return cat.includes('branding') || tags.some(t => t.includes('branding') || t.includes('brand') || t.includes('guidelines') || t.includes('packaging'));
          }
          if (rawFilter === 'logo') {
            return cat.includes('logo') || tags.some(t => t.includes('logo') || t.includes('icon'));
          }
          return false;
        });

    if (filtered.length === 0) {
      track.innerHTML = `<div style="width: 100%; text-align: center; padding: 40px; color: var(--text-light);">Không có dự án nào trong mục này.</div>`;
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (dotsContainer) dotsContainer.style.display = 'none';
      return;
    }

    // Chunk into 6 boxes per slide
    const portfolioSlides = chunkArray(filtered, 6);
    slidesCount = portfolioSlides.length;

    track.innerHTML = portfolioSlides.map(slideItems => `
      <div class="portfolio-slide-grid">
        ${slideItems.map(item => `
          <article class="portfolio-card fade-up-element in-view" data-modal-type="design" data-id="${item.id}" tabindex="0" role="button" aria-label="Xem chi tiết ${item.title}">
            <div class="portfolio-thumb-wrapper">
              <img src="${item.image}" alt="${item.title}" class="portfolio-thumb" loading="lazy" />
              <div class="portfolio-overlay">
                <span class="portfolio-overlay-btn">🔍 Xem chi tiết</span>
              </div>
            </div>
            <div class="portfolio-body">
              <span class="portfolio-category-badge">${item.category}</span>
              <h3 class="portfolio-title">${item.title}</h3>
              <p class="portfolio-desc">${item.description}</p>
            </div>
          </article>
        `).join('')}
      </div>
    `).join('');

    // Attach click events for lightbox modal
    track.querySelectorAll('.portfolio-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id, 10);
        const project = items.find(p => p.id === id);
        if (project) openProjectModal(project, 'design');
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Build Dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < slidesCount; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `slider-dot-btn ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Chuyển tới slide thiết kế ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      }
    }

    // Controls visibility
    if (slidesCount <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (dotsContainer) dotsContainer.style.display = 'none';
    } else {
      if (prevBtn) prevBtn.style.display = 'flex';
      if (nextBtn) nextBtn.style.display = 'flex';
      if (dotsContainer) dotsContainer.style.display = 'flex';
    }

    goToSlide(0);
  }

  // Navigation button handlers
  if (prevBtn) {
    prevBtn.onclick = () => goToSlide(currentSlide - 1);
  }
  if (nextBtn) {
    nextBtn.onclick = () => goToSlide(currentSlide + 1);
  }

  // Touch Swipe Support for Mobile/Tablet
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diffX = touchStartX - touchEndX;
    if (Math.abs(diffX) > 45 && slidesCount > 1) {
      if (diffX > 0) {
        goToSlide(currentSlide + 1);
      } else {
        goToSlide(currentSlide - 1);
      }
    }
  }, { passive: true });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filterDesign || btn.getAttribute('data-filter-design');
      render(filter);
    });
  });

  render('all');
}

/* ==========================================================================
   WEB PROJECTS SHOWCASE MODULE
   ========================================================================== */
function initWebProjects(items = []) {
  const container = document.getElementById('web-projects-grid');
  const filterButtons = document.querySelectorAll('[data-filter-web]');
  if (!container) return;

  function render(filter = 'all') {
    const filtered = (filter === 'all')
      ? items
      : items.filter(item => (item.category || '').toLowerCase() === filter.toLowerCase() || (item.type || '').toLowerCase() === filter.toLowerCase());

    if (filtered.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-light);">Không có mẫu website nào trong mục này.</div>`;
      return;
    }

    container.innerHTML = filtered.map(item => `
      <article class="web-card fade-up-element in-view">
        <div class="browser-bar">
          <span class="browser-dot red"></span>
          <span class="browser-dot yellow"></span>
          <span class="browser-dot green"></span>
          <span class="browser-url-pill">${item.demoUrl || 'https://shopcoweb.vn'}</span>
        </div>
        <div class="web-thumb-wrapper">
          <img src="${item.image}" alt="${item.title}" class="web-thumb" loading="lazy" />
        </div>
        <div class="web-card-body">
          <span class="web-card-type">${item.type || item.category}</span>
          <h3 class="web-card-title">${item.title}</h3>
          <div class="web-card-tech">${item.tech}</div>
          <p class="web-card-desc">${item.description}</p>
          <div class="web-card-actions">
            <button type="button" class="btn btn-outline-primary btn-sm btn-web-detail" data-id="${item.id}">Chi tiết</button>
            <a href="#lien-he" class="btn btn-primary btn-sm">Tôi cần web này</a>
          </div>
        </div>
      </article>
    `).join('');

    // Attach click events for detail modal
    container.querySelectorAll('.btn-web-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const webItem = items.find(w => w.id === id);
        if (webItem) openProjectModal(webItem, 'web');
      });
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filterWeb;
      render(filter);
    });
  });

  render('all');
}

/* ==========================================================================
   LIBRARY (GALLERY PHOTOS & LAZY YOUTUBE VIDEOS - SLIDER CAROUSEL)
   ========================================================================== */
function initLibrary(galleryItems = [], videoItems = []) {
  const tabButtons = document.querySelectorAll('.library-tab-btn');
  const photosWrapper = document.getElementById('photos-slider-wrapper');
  const videosWrapper = document.getElementById('videos-slider-wrapper');

  const photosTrack = document.getElementById('photos-carousel-track');
  const photosDots = document.getElementById('photos-slider-dots');
  const photosPrevBtn = document.getElementById('photos-prev-btn');
  const photosNextBtn = document.getElementById('photos-next-btn');

  const videosTrack = document.getElementById('videos-carousel-track');
  const videosDots = document.getElementById('videos-slider-dots');
  const videosPrevBtn = document.getElementById('videos-prev-btn');
  const videosNextBtn = document.getElementById('videos-next-btn');

  // Helper function to chunk array into pages
  function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks.length > 0 ? chunks : [[]];
  }

  // Generic Slider Initializer
  function setupSlider({ track, dotsContainer, prevBtn, nextBtn, slidesCount, onSlideChange }) {
    let currentSlide = 0;

    function goToSlide(index) {
      if (index < 0) index = 0;
      if (index >= slidesCount) index = slidesCount - 1;
      currentSlide = index;

      track.style.transform = `translateX(-${currentSlide * 100}%)`;

      // Update Dots
      const dots = dotsContainer.querySelectorAll('.slider-dot-btn');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlide);
      });

      // Update Prev / Next buttons
      if (prevBtn) prevBtn.disabled = currentSlide === 0;
      if (nextBtn) nextBtn.disabled = currentSlide === slidesCount - 1;

      if (onSlideChange) onSlideChange(currentSlide);
    }

    // Build Dots
    dotsContainer.innerHTML = '';
    for (let i = 0; i < slidesCount; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `slider-dot-btn ${i === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Chuyển tới slide ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }

    if (prevBtn) {
      prevBtn.onclick = () => goToSlide(currentSlide - 1);
    }
    if (nextBtn) {
      nextBtn.onclick = () => goToSlide(currentSlide + 1);
    }

    // Hide controls if only 1 slide
    if (slidesCount <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (dotsContainer) dotsContainer.style.display = 'none';
    } else {
      if (prevBtn) prevBtn.style.display = 'flex';
      if (nextBtn) nextBtn.style.display = 'flex';
      if (dotsContainer) dotsContainer.style.display = 'flex';
    }

    goToSlide(0);
    return { goToSlide };
  }

  // Helper: Parse DD/MM/YYYY, ISO or Date string into timestamp
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

  // 1. Setup Photos Slider (sorted from newest to oldest, 8 boxes per slide)
  if (photosTrack) {
    const sortedGallery = [...(galleryItems || [])].sort((a, b) => {
      const timeA = parseDateToTimestamp(a.date, a.createdAt, a.id);
      const timeB = parseDateToTimestamp(b.date, b.createdAt, b.id);
      return timeB - timeA; // Descending: newest to oldest
    });

    const photoSlides = chunkArray(sortedGallery, 8);
    photosTrack.innerHTML = photoSlides.map(slideItems => `
      <div class="gallery-slide-grid">
        ${slideItems.map(item => `
          <div class="gallery-box-item fade-up-element" data-id="${item.id || item._id}" role="button" tabindex="0" aria-label="${item.title}">
            <img src="${item.image}" alt="${item.title}" class="gallery-box-img" loading="lazy" />
            <div class="gallery-box-overlay">
              <span class="gallery-box-cat">${item.category}${item.date ? ' · ' + item.date : ''}</span>
              <h3 class="gallery-box-title">${item.title}</h3>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');

    // Attach click events for lightbox modal
    photosTrack.querySelectorAll('.gallery-box-item').forEach(item => {
      item.addEventListener('click', () => {
        const itemId = item.dataset.id;
        const g = sortedGallery.find(x => String(x.id) === String(itemId) || String(x._id) === String(itemId));
        if (g) {
          openProjectModal({
            title: g.title,
            category: g.category + (g.date ? ' · ' + g.date : ''),
            image: g.image,
            description: g.caption
          }, 'gallery');
        }
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });
    });

    setupSlider({
      track: photosTrack,
      dotsContainer: photosDots,
      prevBtn: photosPrevBtn,
      nextBtn: photosNextBtn,
      slidesCount: photoSlides.length
    });
  }

  // Helper: Extract clean 11-char YouTube ID from ID or URL
  function getYouTubeVideoId(urlOrId) {
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

  // Helper: Get live YouTube thumbnail or fallback
  function getYouTubeThumbnail(videoId, fallbackThumb) {
    const cleanId = getYouTubeVideoId(videoId);
    if (cleanId && /^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
      return `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;
    }
    if (fallbackThumb && !fallbackThumb.includes('video-0') && !fallbackThumb.endsWith('.svg')) {
      return fallbackThumb;
    }
    return 'assets/images/default-video-thumbnail.svg';
  }

  // 2. Setup Videos Slider (sorted from newest to oldest)
  if (videosTrack) {
    const sortedVideos = [...(videoItems || [])].sort((a, b) => {
      const timeA = parseDateToTimestamp(a.date, a.createdAt, a.id);
      const timeB = parseDateToTimestamp(b.date, b.createdAt, b.id);
      return timeB - timeA; // Descending: newest to oldest
    });

    const videoSlides = chunkArray(sortedVideos, 6);
    videosTrack.innerHTML = videoSlides.map(slideItems => `
      <div class="videos-slide-grid">
        ${slideItems.map(item => {
          const cleanId = getYouTubeVideoId(item.videoId);
          const thumbUrl = getYouTubeThumbnail(item.videoId, item.thumbnail);
          return `
          <article class="video-box-item fade-up-element">
            <div class="video-thumb-container" data-video-id="${cleanId}" data-video-title="${item.title}" role="button" tabindex="0" aria-label="Phát video ${item.title}">
              <img src="${thumbUrl}" alt="${item.title}" class="video-box-img" loading="lazy" onerror="this.onerror=null; this.src='assets/images/default-video-thumbnail.svg';" />
              <div class="video-box-play-btn" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <span class="video-box-duration">${item.duration || ''}</span>
            </div>
            <div class="video-box-info">
              <div class="video-box-meta">
                <span class="video-box-cat">${item.category || 'YouTube'}</span>
                ${item.date ? `<span class="video-box-date">${item.date}</span>` : ''}
              </div>
              <h3 class="video-box-title">${item.title}</h3>
            </div>
          </article>
          `;
        }).join('')}
      </div>
    `).join('');

    // Lazy load YouTube iframe inside modal only on click
    videosTrack.querySelectorAll('.video-thumb-container').forEach(container => {
      container.addEventListener('click', () => {
        const videoId = container.dataset.videoId;
        const title = container.dataset.videoTitle;
        openVideoModal(videoId, title);
      });
      container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          container.click();
        }
      });
    });

    setupSlider({
      track: videosTrack,
      dotsContainer: videosDots,
      prevBtn: videosPrevBtn,
      nextBtn: videosNextBtn,
      slidesCount: videoSlides.length
    });
  }

  // Switch tabs (Photos vs Videos)
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      if (tab === 'photos') {
        photosWrapper.style.display = 'block';
        videosWrapper.style.display = 'none';
      } else {
        photosWrapper.style.display = 'none';
        videosWrapper.style.display = 'block';
      }
    });
  });
}

/* ==========================================================================
   ARTICLES MODULE (SLIDER CAROUSEL - 6 BOXES PER SLIDE)
   ========================================================================== */
function initArticles(articles = []) {
  const articlesTrack = document.getElementById('articles-carousel-track');
  const articlesDots = document.getElementById('articles-slider-dots');
  const articlesPrevBtn = document.getElementById('articles-prev-btn');
  const articlesNextBtn = document.getElementById('articles-next-btn');

  if (!articlesTrack) return;

  function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks.length > 0 ? chunks : [[]];
  }

  // Chunk articles into 6 items per slide
  const articleSlides = chunkArray(articles, 6);

  articlesTrack.innerHTML = articleSlides.map(slideItems => `
    <div class="articles-slide-grid">
      ${slideItems.map(item => `
        <article class="article-card fade-up-element" data-id="${item.id}" role="button" tabindex="0" aria-label="Đọc bài viết ${item.title}">
          <div class="article-thumb-wrapper">
            <img src="${item.image}" alt="${item.title}" class="article-thumb" loading="lazy" />
          </div>
          <div class="article-body">
            <div class="article-meta">
              <span class="article-category">${item.category}</span>
              <span class="article-date">${item.date}</span>
            </div>
            <h3 class="article-title">${item.title}</h3>
            <p class="article-desc">${item.description}</p>
            <span class="article-readmore">Đọc tiếp →</span>
          </div>
        </article>
      `).join('')}
    </div>
  `).join('');

  // Attach click events for modal
  articlesTrack.querySelectorAll('.article-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id, 10);
      const article = articles.find(a => a.id === id);
      if (article) {
        openProjectModal({
          title: article.title,
          category: article.category + ' · ' + article.date,
          image: article.image,
          description: article.content || article.description
        }, 'article');
      }
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // Setup slider pagination
  let currentSlide = 0;
  const slidesCount = articleSlides.length;

  function goToSlide(index) {
    if (index < 0) index = 0;
    if (index >= slidesCount) index = slidesCount - 1;
    currentSlide = index;

    articlesTrack.style.transform = `translateX(-${currentSlide * 100}%)`;

    // Update Dots
    if (articlesDots) {
      const dots = articlesDots.querySelectorAll('.slider-dot-btn');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlide);
      });
    }

    // Update Prev / Next buttons
    if (articlesPrevBtn) articlesPrevBtn.disabled = currentSlide === 0;
    if (articlesNextBtn) articlesNextBtn.disabled = currentSlide === slidesCount - 1;
  }

  // Build Dots
  if (articlesDots) {
    articlesDots.innerHTML = '';
    for (let i = 0; i < slidesCount; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `slider-dot-btn ${i === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Chuyển tới slide tin tức ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      articlesDots.appendChild(dot);
    }
  }

  if (articlesPrevBtn) {
    articlesPrevBtn.onclick = () => goToSlide(currentSlide - 1);
  }
  if (articlesNextBtn) {
    articlesNextBtn.onclick = () => goToSlide(currentSlide + 1);
  }

  // Hide controls if only 1 slide
  if (slidesCount <= 1) {
    if (articlesPrevBtn) articlesPrevBtn.style.display = 'none';
    if (articlesNextBtn) articlesNextBtn.style.display = 'none';
    if (articlesDots) articlesDots.style.display = 'none';
  } else {
    if (articlesPrevBtn) articlesPrevBtn.style.display = 'flex';
    if (articlesNextBtn) articlesNextBtn.style.display = 'flex';
    if (articlesDots) articlesDots.style.display = 'flex';
  }

  goToSlide(0);
}

/* ==========================================================================
   CONTACT FORM VALIDATION & MOCK STORAGE
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const alertSuccess = document.getElementById('form-success-alert');
  if (!form) return;

  const fullnameInput = document.getElementById('fullname');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const serviceInput = document.getElementById('service-interest');
  const messageInput = document.getElementById('message');

  function validateField(input, condition) {
    if (condition) {
      input.classList.remove('is-invalid');
      return true;
    } else {
      input.classList.add('is-invalid');
      return false;
    }
  }

  // Clear validation on input
  [fullnameInput, phoneInput, emailInput, serviceInput].forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => el.classList.remove('is-invalid'));
    el.addEventListener('change', () => el.classList.remove('is-invalid'));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullname = fullnameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput ? emailInput.value.trim() : '';
    const service = serviceInput.value;
    const message = messageInput ? messageInput.value.trim() : '';

    const isNameValid = validateField(fullnameInput, fullname.length >= 2);
    // Vietnamese phone number validation (10 digits starting with 0 or +84)
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    const isPhoneValid = validateField(phoneInput, phoneRegex.test(phone.replace(/\s+/g, '')));
    
    let isEmailValid = true;
    if (email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isEmailValid = validateField(emailInput, emailRegex.test(email));
    }

    const isServiceValid = validateField(serviceInput, service !== '');

    if (isNameValid && isPhoneValid && isEmailValid && isServiceValid) {
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Gửi yêu cầu cho tôi';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Đang gửi yêu cầu...';
      }

      const payload = {
        "Họ và tên": fullname,
        "Số điện thoại": phone,
        "Email": email || "Không cung cấp",
        "Dịch vụ / Nhu cầu": service,
        "Nội dung yêu cầu": message || "Không có",
        "Thời gian gửi": new Date().toLocaleString('vi-VN'),
        "_subject": `[Website Trần Bá Hộ] Khách hàng mới: ${fullname} - ${phone}`,
        "_template": "table",
        "_captcha": "false"
      };

      try {
        // Gửi thông tin về API /api/contact để lưu trực tiếp vào CSDL MongoDB
        fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullname, phone, email, service, message })
        }).catch(e => console.warn('Lưu vào MongoDB notice:', e));

        // Gửi về hộp thư Gmail qua formsubmit
        await fetch('https://formsubmit.co/ajax/tranbaho@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Gửi formsubmit thông báo:', err);
      } finally {
        // Lưu bản backup vào localStorage
        try {
          const currentLeads = JSON.parse(localStorage.getItem('tbh_leads') || '[]');
          currentLeads.push({
            fullname,
            phone,
            email,
            service,
            message,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('tbh_leads', JSON.stringify(currentLeads));
        } catch (err) {
          console.log('Local storage save notice:', err);
        }

        // Khôi phục trạng thái nút gửi
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }

        // Hiển thị thông báo thành công
        if (alertSuccess) {
          alertSuccess.style.display = 'block';
          alertSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        form.reset();

        // Tự động mở Zalo chat trong tab mới sau 1 giây
        setTimeout(() => {
          try {
            window.open('https://zalo.me/0918326706', '_blank');
          } catch (e) {
            console.log('Popup prevented, user can click button:', e);
          }
        }, 1200);

        // Ẩn thông báo sau 20 giây để khách có đủ thời gian bấm nút Zalo nếu muốn
        setTimeout(() => {
          if (alertSuccess) alertSuccess.style.display = 'none';
        }, 20000);
      }
    }
  });
}

/* ==========================================================================
   FLOATING MOBILE ACTION BAR (HIDE ON FOOTER)
   ========================================================================== */
function initFloatingMobileBar() {
  const floatingBar = document.querySelector('.floating-mobile-bar');
  const footer = document.querySelector('.site-footer');
  if (!floatingBar || !footer) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        floatingBar.classList.add('hidden');
      } else {
        floatingBar.classList.remove('hidden');
      }
    });
  }, { threshold: 0.1 });

  observer.observe(footer);
}

/* ==========================================================================
   MODAL & LIGHTBOX SYSTEM
   ========================================================================== */
let activeModalBackdrop = null;

function initModalSystem() {
  activeModalBackdrop = document.getElementById('global-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (activeModalBackdrop && closeBtn) {
    closeBtn.addEventListener('click', closeModal);
    activeModalBackdrop.addEventListener('click', (e) => {
      if (e.target === activeModalBackdrop) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeModalBackdrop.classList.contains('open')) {
        closeModal();
      }
    });
  }
}

function openProjectModal(item, type = 'general') {
  if (!activeModalBackdrop) return;

  const modalBody = document.getElementById('modal-dynamic-content');
  
  let tagsHtml = '';
  if (item.tags && Array.isArray(item.tags)) {
    tagsHtml = `<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px;">
      ${item.tags.map(t => `<span class="role-tag">${t}</span>`).join('')}
    </div>`;
  }

  let highlightsHtml = '';
  if (item.highlights && Array.isArray(item.highlights)) {
    highlightsHtml = `
      <div style="margin-top: 20px;">
        <strong style="font-size: 0.875rem; color: var(--text);">Điểm nổi bật:</strong>
        <ul style="margin-top: 8px; list-style: disc; margin-left: 20px; font-size: 0.875rem; color: var(--text-muted);">
          ${item.highlights.map(h => `<li style="margin-bottom: 4px;">${h}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  modalBody.innerHTML = `
    <img src="${item.image}" alt="${item.title}" class="modal-image-preview" />
    <div class="modal-body-content">
      <div style="font-size: 0.8125rem; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 6px;">
        ${item.category || ''} ${item.year ? '· ' + item.year : ''}
      </div>
      <h3 style="font-size: 1.5rem; font-weight: 800; color: var(--text); margin-bottom: 12px; line-height: 1.3;">
        ${item.title}
      </h3>
      ${item.tech ? `<div style="font-size: 0.8125rem; color: var(--text-light); margin-bottom: 12px; font-weight: 600;">Công nghệ: ${item.tech}</div>` : ''}
      <p style="font-size: 0.9375rem; color: var(--text-muted); line-height: 1.7;">
        ${item.description}
      </p>
      ${highlightsHtml}
      ${tagsHtml}
      <div style="margin-top: 28px; display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="#lien-he" class="btn btn-primary btn-sm" onclick="closeModal()">Trao đổi về dự án này</a>
        <button type="button" class="btn btn-outline btn-sm" onclick="closeModal()">Đóng cửa sổ</button>
      </div>
    </div>
  `;

  activeModalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openVideoModal(videoId, title) {
  if (!activeModalBackdrop) return;
  const modalBody = document.getElementById('modal-dynamic-content');
  
  let cleanId = (videoId || '').trim();
  const match = cleanId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
  if (match && match[1]) {
    cleanId = match[1];
  } else {
    const paramMatch = cleanId.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
    if (paramMatch && paramMatch[1]) {
      cleanId = paramMatch[1];
    }
  }

  modalBody.innerHTML = `
    <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; background: #000; border-radius: 16px 16px 0 0;">
      <iframe 
        style="position: absolute; top:0; left: 0; width: 100%; height: 100%; border:0;"
        src="https://www.youtube.com/embed/${cleanId}?autoplay=1&rel=0" 
        title="${title}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    </div>
    <div class="modal-body-content">
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text); margin-bottom: 10px;">${title}</h3>
      <p style="font-size: 0.875rem; color: var(--text-light);">Video hướng dẫn chuyên đề từ giảng viên Trần Bá Hộ.</p>
      <div style="margin-top: 20px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeModal()">Đóng video</button>
      </div>
    </div>
  `;

  activeModalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!activeModalBackdrop) return;
  activeModalBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  // Clear iframe if open
  setTimeout(() => {
    const modalBody = document.getElementById('modal-dynamic-content');
    if (modalBody) modalBody.innerHTML = '';
  }, 250);
}

/* ==========================================================================
   SCROLL FADE-UP ANIMATIONS (IntersectionObserver)
   ========================================================================== */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-up-element');
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}
