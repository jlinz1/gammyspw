/* ============================================================
   Gammy's Pressure Washing - script.js
   ============================================================ */

/* --- Google Reviews (Places API) ---
   Fill in your API key and Place ID below (see setup instructions).
   Leave either blank to keep the static placeholder reviews in index.html. */
const GOOGLE_PLACES_API_KEY = '';
const GOOGLE_PLACE_ID = '';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.renderGoogleReviews = function () {
  const grid = document.querySelector('.reviews-grid');
  if (!grid || !window.google || !google.maps || !google.maps.places) return;

  const service = new google.maps.places.PlacesService(document.createElement('div'));
  service.getDetails(
    { placeId: GOOGLE_PLACE_ID, fields: ['reviews'] },
    (place, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !place.reviews || !place.reviews.length) {
        return; // Something went wrong - keep the static fallback reviews already in the HTML
      }

      grid.innerHTML = '';
      place.reviews.slice(0, 5).forEach(review => {
        const stars = '⭐'.repeat(Math.round(review.rating));
        const initials = review.author_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

        const card = document.createElement('div');
        card.className = 'review-card reveal revealed';
        card.innerHTML = `
          <div class="review-stars" aria-label="${review.rating} out of 5 stars">${stars}</div>
          <p class="review-text">"${escapeHtml(review.text)}"</p>
          <div class="reviewer">
            <div class="reviewer-avatar" aria-hidden="true">${escapeHtml(initials)}</div>
            <div>
              <div class="reviewer-name">${escapeHtml(review.author_name)}</div>
              <div class="reviewer-loc">${escapeHtml(review.relative_time_description)}</div>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
    }
  );
};

if (GOOGLE_PLACES_API_KEY && GOOGLE_PLACE_ID) {
  const mapsScript = document.createElement('script');
  mapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&callback=renderGoogleReviews&loading=async`;
  mapsScript.async = true;
  document.head.appendChild(mapsScript);
}

/* --- Nav: shadow on scroll --- */
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });
}

/* --- Mobile hamburger menu --- */
const hamburger = document.querySelector('.hamburger');
const navMobile = document.querySelector('.nav-mobile');

if (hamburger && navMobile) {
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navMobile.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile menu when a link is clicked
  navMobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMobile.classList.remove('open');
    });
  });
}

/* --- Active nav link highlighting via Intersection Observer --- */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"], .nav-mobile a[href^="#"]');

if (sections.length && navLinks.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${entry.target.id}`
          );
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(sec => observer.observe(sec));
}

/* --- Scroll-reveal animation --- */
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => revealObserver.observe(el));
}

/* --- "Find Your Solution" cards - scroll to relevant service --- */
// Map each solution card data-target to a service card index (0-based in the grid)
// Order matches the HTML: 0=Driveways, 1=Pathways/Floors, 2=Walls, 3=Awnings, 4=Moss, 5=Pool
const solutionMap = {
  'driveway': 0,   // Driveways & Garages
  'walls':    2,   // Walls & Exterior Surfaces
  'moss':     4,   // Moss & Algae Removal
  'urgent':   0,   // Default to first card; urgent goes to contact page
};

const solutionCards = document.querySelectorAll('.solution-card[data-target]');
const serviceCards  = document.querySelectorAll('.service-card');

solutionCards.forEach(card => {
  card.addEventListener('click', () => {
    const key = card.dataset.target;

    // Urgent card goes straight to the contact page
    if (key === 'urgent') {
      window.location.href = 'contact.html';
      return;
    }

    // Toggle active state
    solutionCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    const idx = solutionMap[key];

    if (idx !== undefined && serviceCards[idx]) {
      // Scroll the services section into view
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Briefly highlight the target card
      serviceCards.forEach(c => c.style.outline = '');
      serviceCards.forEach(c => c.style.boxShadow = '');

      setTimeout(() => {
        serviceCards[idx].style.outline = '3px solid #1E56E3';
        serviceCards[idx].style.boxShadow = '0 0 0 6px rgba(30,86,227,.15)';
        serviceCards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Remove highlight after 2.5 s
        setTimeout(() => {
          serviceCards[idx].style.outline = '';
          serviceCards[idx].style.boxShadow = '';
        }, 2500);
      }, 400);
    }
  });
});

/* --- Google Sheet submission ---
   Paste your Apps Script Web App URL below (see setup instructions).
   Every quote request is sent here and appended as a row in the sheet. */
const SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxP4RB1z7-kKwdYBSifdg62TdxFel78SAdCJvhY3fODRaAKEkdZgnKHlU644yvbo7Pj/exec';

/* --- Form Validation --- */
function validateForm(formEl) {
  let valid = true;

  // Clear previous errors
  formEl.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  formEl.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  // Helper: show error on a field
  function showError(input, msg) {
    input.classList.add('error');
    const errEl = input.parentElement.querySelector('.field-error');
    if (errEl) errEl.textContent = msg;
    valid = false;
  }

  // Validate each required field
  formEl.querySelectorAll('[required]').forEach(input => {
    if (!input.value.trim()) {
      showError(input, 'This field is required.');
    }
  });

  // Email format
  const emailInput = formEl.querySelector('input[type="email"]');
  if (emailInput && emailInput.value.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailInput.value.trim())) {
      showError(emailInput, 'Please enter a valid email address.');
    }
  }

  // Phone: at least 8 digits
  const phoneInput = formEl.querySelector('input[type="tel"]');
  if (phoneInput && phoneInput.value.trim()) {
    const digitsOnly = phoneInput.value.replace(/\D/g, '');
    if (digitsOnly.length < 8) {
      showError(phoneInput, 'Please enter a valid phone number.');
    }
  }

  return valid;
}

document.querySelectorAll('.quote-form').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();

    if (!validateForm(form)) return;

    const successEl = form.querySelector('.form-success');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    if (!SHEET_WEBHOOK_URL) {
      alert("The form isn't connected yet. Please call us instead.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
      return;
    }

    fetch(SHEET_WEBHOOK_URL, {
      method: 'POST',
      body: new FormData(form)
    })
      .then(response => {
        if (response.ok) {
          // Show success message
          if (successEl) {
            successEl.classList.add('visible');
            // Scroll success msg into view on mobile
            successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          // Reset form after a short delay
          setTimeout(() => {
            form.reset();
            if (successEl) successEl.classList.remove('visible');
          }, 5000);
        } else {
          alert("Sorry, something went wrong sending your request. Please call us instead.");
        }
      })
      .catch(() => {
        alert("Sorry, something went wrong sending your request. Please call us instead.");
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      });
  });
});

/* --- Smooth scroll for anchor links (fallback for older Safari) --- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
