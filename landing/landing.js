/**
 * Apertur Interactive Landing Page Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  const demoCanvas = document.getElementById('demoCanvas');
  const demoHalo = document.getElementById('demoHalo');
  const demoTimer = document.getElementById('demoTimer');
  const demoPauseBtn = document.getElementById('demoPauseBtn');
  const demoHudDot = document.getElementById('demoHudDot');
  const clickCounter = document.getElementById('clickCounter');
  const swatches = document.querySelectorAll('.demo-swatch');
  const btnCopyCode = document.getElementById('btnCopyCode');
  const installCodeBlock = document.getElementById('installCodeBlock');

  let activeColor = '#f59e0b';
  let activeFill = 'rgba(245, 158, 11, 0.22)';
  let clicks = 0;
  let isDemoPaused = false;

  // 1. Swatch Theme Selector
  swatches.forEach((btn) => {
    btn.addEventListener('click', () => {
      swatches.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeColor = btn.dataset.color;
      activeFill = btn.dataset.fill;
      if (demoHalo) {
        demoHalo.style.borderColor = activeColor;
        demoHalo.style.background = activeFill;
        demoHalo.style.boxShadow = `0 0 20px ${activeFill}`;
      }
    });
  });

  // 2. Full-Stage Cursor Spotlight & Click Shockwaves
  if (demoCanvas && demoHalo) {
    demoCanvas.addEventListener('mousemove', (e) => {
      const rect = demoCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      demoHalo.style.opacity = '1';
      demoHalo.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    demoCanvas.addEventListener('mouseleave', () => {
      demoHalo.style.opacity = '0';
    });

    demoCanvas.addEventListener('mousedown', (e) => {
      const rect = demoCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      demoHalo.classList.add('pressing');

      clicks += 1;
      if (clickCounter) clickCounter.textContent = clicks.toString();

      // Primary expanding ring
      const ripple = document.createElement('div');
      ripple.style.position = 'absolute';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '16px';
      ripple.style.height = '16px';
      ripple.style.marginLeft = '-8px';
      ripple.style.marginTop = '-8px';
      ripple.style.borderRadius = '50%';
      ripple.style.border = `2.2px solid ${activeColor}`;
      ripple.style.background = activeFill;
      ripple.style.boxShadow = `0 0 16px ${activeColor}`;
      ripple.style.pointerEvents = 'none';
      ripple.style.transform = 'scale(0.3)';
      ripple.style.opacity = '1';
      ripple.style.zIndex = '19';
      ripple.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease';

      demoCanvas.appendChild(ripple);
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(4.6)';
        ripple.style.opacity = '0';
      });
      setTimeout(() => ripple.remove(), 510);
    });

    window.addEventListener('mouseup', () => {
      demoHalo.classList.remove('pressing');
    });
  }

  // 3. Interactive Pause / Resume on HUD Replica
  if (demoPauseBtn) {
    demoPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isDemoPaused = !isDemoPaused;
      demoPauseBtn.textContent = isDemoPaused ? 'Resume' : 'Pause';
      if (demoHudDot) {
        demoHudDot.classList.toggle('paused', isDemoPaused);
      }
    });
  }

  // 4. Live Timer Counter
  let seconds = 14;
  if (demoTimer) {
    setInterval(() => {
      if (isDemoPaused) return;
      seconds = (seconds + 1) % 3600;
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      demoTimer.textContent = `${m}:${s}`;
    }, 1000);
  }

  // 5. Copy Terminal Commands Button
  if (btnCopyCode && installCodeBlock) {
    btnCopyCode.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(installCodeBlock.textContent.trim());
        btnCopyCode.textContent = 'Copied!';
        setTimeout(() => {
          btnCopyCode.textContent = 'Copy Commands';
        }, 1800);
      } catch (_) {}
    });
  }

  // 6. Scroll Reveal Observer
  const revealItems = document.querySelectorAll('.reveal-up');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((el) => observer.observe(el));

  // 7. Dynamic Radial Hover Glow on Bento Cards
  const bentoCards = document.querySelectorAll('.bento-card');
  bentoCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  });

  // 8. Showcase Gallery Tabs Switcher
  const galleryTabs = document.querySelectorAll('.gallery-tab');
  const gallerySlides = document.querySelectorAll('.gallery-slide');
  galleryTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      galleryTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.dataset.target;
      gallerySlides.forEach((slide) => {
        slide.classList.toggle('active', slide.id === targetId);
      });
    });
  });

  // 9. Documentation Hub Tabs Switcher
  const docTabs = document.querySelectorAll('.doc-tab-btn');
  const docPanels = document.querySelectorAll('.doc-card-panel');
  docTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      docTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.dataset.docTarget;
      docPanels.forEach((panel) => {
        panel.classList.toggle('active', panel.id === targetId);
      });
    });
  });

  // 10. Module 1: Animated Browser URL Cycle
  const animUrlDisplay = document.getElementById('animUrlDisplay');
  const animDockTimer = document.getElementById('animDockTimer');
  const urls = [
    'https://app.saas.io/project',
    'https://accounts.google.com/oauth/v2/auth',
    'https://app.saas.io/dashboard'
  ];
  let urlIndex = 0;
  if (animUrlDisplay) {
    setInterval(() => {
      urlIndex = (urlIndex + 1) % urls.length;
      animUrlDisplay.style.opacity = '0';
      setTimeout(() => {
        animUrlDisplay.textContent = urls[urlIndex];
        animUrlDisplay.style.opacity = '1';
      }, 200);
    }, 3200);
  }

  let dockSeconds = 34;
  if (animDockTimer) {
    setInterval(() => {
      dockSeconds = (dockSeconds + 1) % 3600;
      const m = Math.floor(dockSeconds / 60).toString().padStart(2, '0');
      const s = (dockSeconds % 60).toString().padStart(2, '0');
      animDockTimer.textContent = `${m}:${s}`;
    }, 1000);
  }

  // 11. Module 2: Voice Simulation Trigger
  const btnSimulateVoice = document.getElementById('btnSimulateVoice');
  const animVuFill = document.getElementById('animVuFill');
  const animAudioStatusLabel = document.getElementById('animAudioStatusLabel');
  if (btnSimulateVoice && animVuFill) {
    btnSimulateVoice.addEventListener('click', () => {
      animVuFill.style.animation = 'none';
      animVuFill.style.width = '92%';
      if (animAudioStatusLabel) animAudioStatusLabel.textContent = 'Voice detected: Peak clarity (92%)';
      setTimeout(() => {
        animVuFill.style.animation = 'vuMeterDance 1.6s ease-in-out infinite alternate';
        if (animAudioStatusLabel) animAudioStatusLabel.textContent = 'Live input: Speaking detected';
      }, 1800);
    });
  }

  // 12. Module 3: Annotation Tool Switcher Demo
  const animToolChips = document.querySelectorAll('.anim-tool-chip');
  animToolChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      animToolChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // 13. Module 4: Export Presets Clicker
  const animPresetBtns = document.querySelectorAll('.anim-preset-btn');
  animPresetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      animPresetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 14. Mobile Navigation Drawer Controller
  const btnNavToggle = document.getElementById('btnNavToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');

  if (btnNavToggle && mobileNavDrawer) {
    const toggleMobileNav = (forceState) => {
      const isCurrentlyOpen = btnNavToggle.classList.contains('open');
      const shouldOpen = typeof forceState === 'boolean' ? forceState : !isCurrentlyOpen;

      if (shouldOpen) {
        btnNavToggle.classList.add('open');
        btnNavToggle.setAttribute('aria-expanded', 'true');
        mobileNavDrawer.classList.add('open');
        mobileNavDrawer.setAttribute('aria-hidden', 'false');
        if (mobileNavBackdrop) {
          mobileNavBackdrop.classList.add('open');
          mobileNavBackdrop.setAttribute('aria-hidden', 'false');
        }
        document.body.style.overflow = 'hidden';
      } else {
        btnNavToggle.classList.remove('open');
        btnNavToggle.setAttribute('aria-expanded', 'false');
        mobileNavDrawer.classList.remove('open');
        mobileNavDrawer.setAttribute('aria-hidden', 'true');
        if (mobileNavBackdrop) {
          mobileNavBackdrop.classList.remove('open');
          mobileNavBackdrop.setAttribute('aria-hidden', 'true');
        }
        document.body.style.overflow = '';
      }
    };

    btnNavToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileNav();
    });

    if (mobileNavBackdrop) {
      mobileNavBackdrop.addEventListener('click', () => {
        toggleMobileNav(false);
      });
    }

    // Close when clicking any mobile link
    const mobileLinks = mobileNavDrawer.querySelectorAll('a');
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        toggleMobileNav(false);
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (
        mobileNavDrawer.classList.contains('open') &&
        !mobileNavDrawer.contains(e.target) &&
        !btnNavToggle.contains(e.target)
      ) {
        toggleMobileNav(false);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNavDrawer.classList.contains('open')) {
        toggleMobileNav(false);
      }
    });
  }
});
