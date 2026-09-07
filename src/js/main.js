/* ============================================
   FRESH VOICES — Main JavaScript
   ============================================ */

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {

  // --- Nav scroll behaviour ---
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  // --- Mobile menu ---
  const hamburger = document.querySelector('.nav__hamburger');
  const navLinks  = document.querySelector('.nav__links');
  const mainEl    = document.getElementById('main');
  const footerEl  = document.querySelector('.footer');
  let scrollPos   = 0;

  const menuLabels = () => {
    const isDE = document.documentElement.lang !== 'en';
    return {
      open:  isDE ? 'Menü öffnen'   : 'Open menu',
      close: isDE ? 'Menü schließen' : 'Close menu',
    };
  };

  const openMenu = () => {
    scrollPos = window.scrollY;
    navLinks.classList.add('open');
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', menuLabels().close);
    document.documentElement.classList.add('menu-open');
    if (mainEl) mainEl.setAttribute('inert', '');
    if (footerEl) footerEl.setAttribute('inert', '');
    const firstLink = navLinks.querySelector('a');
    if (firstLink) firstLink.focus();
  };

  const closeMenu = () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', menuLabels().open);
    document.documentElement.classList.remove('menu-open');
    if (mainEl) mainEl.removeAttribute('inert');
    if (footerEl) footerEl.removeAttribute('inert');
    window.scrollTo(0, scrollPos);
    hamburger.focus();
  };

  if (hamburger && navLinks) {
    hamburger.setAttribute('aria-label', menuLabels().open);

    hamburger.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (navLinks.classList.contains('open')) closeMenu();
      });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeMenu();
      }
    });

    // Close on click on the overlay itself (not on a link)
    navLinks.addEventListener('click', (e) => {
      if (e.target === navLinks) closeMenu();
    });

    // Close on resize past the mobile breakpoint
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navLinks.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  // --- Active nav link ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // --- Language toggle ---
  const langBtn = document.querySelector('.nav__lang');
  if (langBtn) {
    const LANG_KEY = 'fv-lang';
    let storedLang = 'de';
    try {
      storedLang = localStorage.getItem(LANG_KEY) || 'de';
    } catch (e) { /* localStorage unavailable (e.g. private browsing) — default to de */ }

    const applyLang = (lang) => {
      langBtn.textContent = lang === 'de' ? 'EN' : 'DE';
      document.documentElement.lang = lang;
      document.querySelectorAll('[data-de], [data-en]').forEach(el => {
        const value = lang === 'de' ? el.dataset.de : el.dataset.en;
        if (value == null) return;
        // Some values (e.g. the homepage hero title) carry inline <br>/<em> markup —
        // render it instead of dumping literal tags as text.
        if (value.includes('<')) {
          el.innerHTML = value;
        } else {
          el.textContent = value;
        }
      });
      // Full block-level swaps (e.g. about.html's biography), same single source of truth.
      document.querySelectorAll('[data-lang-block]').forEach(el => {
        el.style.display = el.dataset.langBlock === lang ? 'block' : 'none';
      });
    };

    let lang = storedLang;
    applyLang(lang);

    langBtn.addEventListener('click', () => {
      lang = lang === 'de' ? 'en' : 'de';
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
      applyLang(lang);
    });
  }

  // --- Custom audio players ---
  document.querySelectorAll('.audio-player').forEach(player => {
    const src      = player.dataset.src;
    if (!src) return;

    const audio    = new Audio();
    audio.preload  = 'metadata';
    audio.src      = src;
    const playBtn  = player.querySelector('.audio-player__play');
    const bar      = player.querySelector('.audio-player__bar');
    const progress = player.querySelector('.audio-player__progress');
    const timeEl   = player.querySelector('.audio-player__time');
    const playIcon = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><polygon points="3,1 15,8 3,15"/></svg>`;
    const pauseIcon= `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="1" width="4" height="14" rx="1"/><rect x="10" y="1" width="4" height="14" rx="1"/></svg>`;

    playBtn.innerHTML = playIcon;
    const playLabel  = playBtn.getAttribute('aria-label') || 'Play';
    const pauseLabel = playLabel.replace(/^Play/, 'Pause');
    const setPlayBtnState = (isPlaying) => {
      playBtn.innerHTML = isPlaying ? pauseIcon : playIcon;
      playBtn.setAttribute('aria-label', isPlaying ? pauseLabel : playLabel);
    };

    if (progress) {
      progress.setAttribute('role', 'slider');
      progress.setAttribute('aria-valuemin', '0');
      progress.setAttribute('aria-valuemax', '100');
      progress.setAttribute('aria-valuenow', '0');
      progress.setAttribute('aria-label', 'Wiedergabeposition');
      progress.setAttribute('tabindex', '0');
    }

    const fmt = s => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60).toString().padStart(2, '0');
      return `${m}:${sec}`;
    };

    const showDuration = () => {
      if (isFinite(audio.duration) && audio.duration > 0 && timeEl) {
        timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
      }
    };
    audio.addEventListener('loadedmetadata', showDuration);
    audio.addEventListener('durationchange', showDuration);

    playBtn.addEventListener('click', () => {
      document.querySelectorAll('.audio-player').forEach(p => {
        if (p !== player) {
          const a = p._audio;
          if (a && !a.paused) {
            a.pause();
            const otherBtn = p.querySelector('.audio-player__play');
            otherBtn.innerHTML = playIcon;
            otherBtn.setAttribute('aria-label', (otherBtn.getAttribute('aria-label') || 'Play').replace(/^Pause/, 'Play'));
          }
        }
      });

      if (audio.paused) {
        audio.play();
        setPlayBtnState(true);
      } else {
        audio.pause();
        setPlayBtnState(false);
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (!isFinite(audio.duration) || audio.duration === 0) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      bar.style.transform = `scaleX(${pct / 100})`;
      if (progress) progress.setAttribute('aria-valuenow', Math.round(pct));
      if (timeEl) timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    });

    audio.addEventListener('ended', () => {
      setPlayBtnState(false);
      bar.style.transform = 'scaleX(0)';
      if (progress) progress.setAttribute('aria-valuenow', '0');
    });

    if (progress) {
      progress.addEventListener('click', e => {
        const rect = progress.getBoundingClientRect();
        const pct  = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pct * audio.duration;
      });

      progress.addEventListener('keydown', e => {
        if (!isFinite(audio.duration) || audio.duration === 0) return;
        const step = e.shiftKey ? 10 : 5;
        if (e.key === 'ArrowRight') {
          audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
          e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
          audio.currentTime = Math.max(0, audio.currentTime - step);
          e.preventDefault();
        }
      });
    }

    player._audio = audio;
  });

  // --- Hero video mute toggle ---
  const heroVideo = document.querySelector('video.hero__photo');
  const muteBtn   = document.querySelector('.hero__mute-btn');
  if (heroVideo && muteBtn) {
    const mutedSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
    const soundSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
    muteBtn.addEventListener('click', () => {
      heroVideo.muted = !heroVideo.muted;
      const isMuted = heroVideo.muted;
      muteBtn.innerHTML = isMuted ? mutedSVG : soundSVG;
      muteBtn.setAttribute('aria-label', isMuted ? 'Ton einschalten' : 'Ton ausschalten');
      muteBtn.setAttribute('aria-pressed', String(!isMuted));
    });
  }

  // --- Scroll reveal ---
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 15% 0px' });
    revealEls.forEach(el => observer.observe(el));
  }

  // --- Contact form (Cloudflare Worker: POST /api/contact) ---
  const form = document.getElementById('contactForm');
  if (form) {
    const isDE = () => {
      const langBtn = document.querySelector('.nav__lang');
      return !langBtn || langBtn.textContent.trim() === 'EN';
    };

    const validationMessages = {
      firstName: { de: 'Bitte Vornamen eingeben.', en: 'Please enter your first name.' },
      lastName:  { de: 'Bitte Nachnamen eingeben.', en: 'Please enter your last name.' },
      email:     { de: 'Bitte gültige E-Mail-Adresse eingeben.', en: 'Please enter a valid email address.' },
      projectType: { de: 'Bitte Projektart wählen.', en: 'Please select a project type.' },
      message:   { de: 'Bitte Nachricht eingeben (mind. 10 Zeichen).', en: 'Please enter a message (min. 10 characters).' },
    };

    const captchaMessage = { de: 'Bitte Sicherheitsprüfung bestätigen.', en: 'Please confirm the security check.' };

    const requiredFields = ['firstName', 'lastName', 'email', 'projectType', 'message'];

    function clearErrors() {
      form.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));
      form.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; });
    }

    function clearFieldError(name) {
      const field = form.querySelector(`[name="${name}"]`);
      const group = field && field.closest('.form-group');
      if (!group) return;
      group.classList.remove('has-error');
      const errorEl = group.querySelector('.form-error');
      if (errorEl) errorEl.textContent = '';
    }

    function showFieldError(name, msg) {
      const field = form.querySelector(`[name="${name}"]`);
      if (!field) return;
      const group = field.closest('.form-group');
      const errorEl = group && group.querySelector('.form-error');
      if (group) group.classList.add('has-error');
      if (errorEl) errorEl.textContent = msg;
    }

    function validateField(name) {
      const el = form.querySelector(`[name="${name}"]`);
      if (!el) return true;
      if (el.validity.valid) {
        clearFieldError(name);
        return true;
      }
      showFieldError(name, validationMessages[name][isDE() ? 'de' : 'en']);
      return false;
    }

    function validateForm() {
      clearErrors();
      let valid = true;
      requiredFields.forEach(name => {
        if (!validateField(name)) valid = false;
      });
      return valid;
    }

    // Live feedback: flag a field once the visitor leaves it, clear the
    // error as soon as they've fixed it (so correction is confirmed while typing).
    requiredFields.forEach(name => {
      const el = form.querySelector(`[name="${name}"]`);
      if (!el) return;
      el.addEventListener('blur', () => validateField(name));
      el.addEventListener('input', () => {
        if (el.closest('.form-group').classList.contains('has-error') && el.validity.valid) {
          clearFieldError(name);
        }
      });
    });

    function showFeedback(type, message) {
      const fb = document.getElementById('formFeedback');
      if (!fb) return;
      fb.className = 'form-feedback is-' + type;
      fb.textContent = message;
      // iOS Safari leaves the on-screen keyboard open (and the feedback
      // below the fold behind it) unless focus is explicitly moved away
      // from the field the visitor was last in.
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      fb.setAttribute('tabindex', '-1');
      fb.scrollIntoView({ block: 'center', behavior: 'smooth' });
      fb.focus({ preventScroll: true });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fb = document.getElementById('formFeedback');
      if (fb) { fb.className = 'form-feedback'; fb.textContent = ''; }

      if (!validateForm()) return;

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = isDE() ? 'Wird gesendet…' : 'Sending…';
      btn.disabled = true;

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });

        let data = null;
        try { data = await response.json(); } catch { /* non-JSON response, fall through to status check */ }

        if (response.ok && data && data.ok) {
          showFeedback('success', isDE()
            ? 'Nachricht gesendet! Ich melde mich innerhalb von 24 Stunden.'
            : "Message sent! I'll get back to you within 24 hours.");
          form.reset();
          if (window.turnstile) window.turnstile.reset();
          btn.textContent = originalText;
        } else if (data && data.error === 'captcha') {
          showFeedback('error', captchaMessage[isDE() ? 'de' : 'en']);
          if (window.turnstile) window.turnstile.reset();
          btn.textContent = originalText;
        } else if (response.status === 503 && data && data.error === 'not_configured') {
          showFeedback('error', isDE()
            ? 'Das Formular ist noch nicht freigeschaltet – bitte direkt an wolf.valtiner@freshvoices.at schreiben.'
            : "The form isn't live yet – please email wolf.valtiner@freshvoices.at directly.");
          btn.textContent = originalText;
        } else {
          throw new Error((data && data.error) || String(response.status));
        }
      } catch {
        showFeedback('error', isDE()
          ? 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder schreiben Sie an wolf.valtiner@freshvoices.at.'
          : 'Failed to send. Please try again or email wolf.valtiner@freshvoices.at.');
        if (window.turnstile) window.turnstile.reset();
        btn.textContent = originalText;
      } finally {
        btn.disabled = false;
      }
    });
  }

});
