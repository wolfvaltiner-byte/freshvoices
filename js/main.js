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
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Close on link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
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
    let lang = 'DE';
    langBtn.addEventListener('click', () => {
      lang = lang === 'DE' ? 'EN' : 'DE';
      langBtn.textContent = lang === 'DE' ? 'EN' : 'DE';
      document.documentElement.lang = lang.toLowerCase();
      document.querySelectorAll('[data-de], [data-en]').forEach(el => {
        el.textContent = lang === 'DE' ? el.dataset.de : el.dataset.en;
      });
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
            p.querySelector('.audio-player__play').innerHTML = playIcon;
          }
        }
      });

      if (audio.paused) {
        audio.play();
        playBtn.innerHTML = pauseIcon;
      } else {
        audio.pause();
        playBtn.innerHTML = playIcon;
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (!isFinite(audio.duration) || audio.duration === 0) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      bar.style.width = pct + '%';
      if (progress) progress.setAttribute('aria-valuenow', Math.round(pct));
      if (timeEl) timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    });

    audio.addEventListener('ended', () => {
      playBtn.innerHTML = playIcon;
      bar.style.width = '0%';
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
    }, { threshold: 0.12 });
    revealEls.forEach(el => observer.observe(el));
  }

  // --- Contact form (Netlify Forms) ---
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

    function clearErrors() {
      form.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));
      form.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; });
    }

    function showFieldError(name, msg) {
      const field = form.querySelector(`[name="${name}"]`);
      if (!field) return;
      const group = field.closest('.form-group');
      const errorEl = group && group.querySelector('.form-error');
      if (group) group.classList.add('has-error');
      if (errorEl) errorEl.textContent = msg;
    }

    function validateForm() {
      clearErrors();
      const lang = isDE() ? 'de' : 'en';
      let valid = true;
      const fields = ['firstName', 'lastName', 'email', 'projectType', 'message'];
      fields.forEach(name => {
        const el = form.querySelector(`[name="${name}"]`);
        if (el && !el.validity.valid) {
          showFieldError(name, validationMessages[name][lang]);
          valid = false;
        }
      });
      return valid;
    }

    function showFeedback(type, message) {
      const fb = document.getElementById('formFeedback');
      if (!fb) return;
      fb.className = 'form-feedback is-' + type;
      fb.textContent = message;
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

      try {
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });

        if (response.ok) {
          showFeedback('success', isDE()
            ? 'Nachricht gesendet! Ich melde mich innerhalb von 24 Stunden.'
            : "Message sent! I'll get back to you within 24 hours.");
          form.reset();
          btn.textContent = originalText;
        } else {
          throw new Error(response.status);
        }
      } catch {
        showFeedback('error', isDE()
          ? 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder schreiben Sie an wolf.valtiner@freshvoices.at.'
          : 'Failed to send. Please try again or email wolf.valtiner@freshvoices.at.');
        btn.textContent = originalText;
      } finally {
        btn.disabled = false;
      }
    });
  }

});
