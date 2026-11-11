/* =========================================================
   WGP ДБЖ — script.js (фінальна версія)
   Відправка замовлень у KeyCRM (sunsetshop.keycrm.app)
   через Cloudflare Worker
   ========================================================= */

(function () {
  'use strict';

  /* ---------------------------------------------------------
     ⚙️ НАЛАШТУВАННЯ — ЗАМІНІТЬ ТІЛЬКИ ЦЕ
     --------------------------------------------------------- */
  const WORKER_URL = 'https://keycrm-proxy.635mode.workers.dev';

  /* ---------------------------------------------------------
     ЕЛЕМЕНТИ
     --------------------------------------------------------- */
  const form = document.getElementById('orderForm');
  const submitBtn = document.getElementById('submitBtn');
  const formNote = document.getElementById('formNote');
  const stickyBuy = document.getElementById('stickyBuy');
  const orderSection = document.getElementById('order');

  /* ---------------------------------------------------------
     УТИЛІТИ
     --------------------------------------------------------- */

  function showNote(text, type) {
    if (!formNote) return;
    formNote.textContent = text;
    formNote.classList.remove('error', 'success');
    if (type) formNote.classList.add(type);
  }

  function normalizePhone(raw) {
    let v = String(raw || '').trim().replace(/[\s\-()]/g, '');
    if (v.startsWith('0')) v = '+38' + v;
    if (v.startsWith('380')) v = '+' + v;
    if (!v.startsWith('+')) v = '+' + v;
    return v;
  }

  function isValidPhone(phone) {
    return /^\+380\d{9}$/.test(phone);
  }

  function getUtm() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
      const v = params.get(k);
      if (v) utm[k] = v;
    });
    return utm;
  }

  /* ---------------------------------------------------------
     ВАЛІДАЦІЯ
     --------------------------------------------------------- */
  function validate(data) {
    if (!data.name || data.name.length < 2) {
      return 'Вкажіть ім\u2019я (мінімум 2 символи)';
    }
    const phone = normalizePhone(data.phone);
    if (!isValidPhone(phone)) {
      return 'Вкажіть телефон у форматі +380XXXXXXXXX';
    }
    return null;
  }

  /* ---------------------------------------------------------
     ВІДПРАВКА В KEYCRM
     --------------------------------------------------------- */
  async function submitOrder(data) {
    const phone = normalizePhone(data.phone);
    const utm = getUtm();

    const payload = {
      title: 'Замовлення WGP — ' + data.name,
      source_id: 1,
      manager_comment: data.comment || '',
      contact: {
        full_name: data.name,
        phone: phone
      }
    };

    Object.keys(utm).forEach(function (k) {
      payload[k] = utm[k];
    });

    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Обробка конкретних статусів
    if (res.status === 403) {
      throw new Error('FORBIDDEN');
    }
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    if (res.status === 422) {
      const body = await res.text().catch(function () { return ''; });
      console.error('[WGP] 422 body:', body);
      throw new Error('INVALID_PAYLOAD');
    }
    if (!res.ok) {
      const text = await res.text().catch(function () { return ''; });
      throw new Error('HTTP_' + res.status + ': ' + text);
    }

    return res.json().catch(function () { return {}; });
  }

  /* ---------------------------------------------------------
     ОБРОБКА ФОРМИ
     --------------------------------------------------------- */
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const data = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        comment: document.getElementById('comment').value.trim()
      };

      const error = validate(data);
      if (error) {
        showNote(error, 'error');
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Відправляємо...';
      showNote('Обробка замовлення…', null);

      try {
        await submitOrder(data);

        showNote('Дякуємо! Ми зв\u2019яжемося з вами найближчим часом.', 'success');
        form.reset();
        submitBtn.innerHTML = 'Замовлення прийнято ✓';

        setTimeout(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }, 3000);

      } catch (err) {
        console.error('[WGP] Помилка:', err.message);

        if (err.message === 'FORBIDDEN') {
          showNote('Сервіс тимчасово недоступний. Спробуйте через кілька хвилин.', 'error');
        } else if (err.message === 'UNAUTHORIZED') {
          showNote('Помилка налаштування. Зв\u2019яжіться з нами.', 'error');
        } else if (err.message === 'INVALID_PAYLOAD') {
          showNote('Перевірте дані та спробуйте ще раз.', 'error');
        } else {
          showNote('Помилка відправки. Спробуйте ще раз.', 'error');
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  /* ---------------------------------------------------------
     STICKY-BUY
     --------------------------------------------------------- */
  if (stickyBuy && orderSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            stickyBuy.classList.add('hidden');
          } else {
            stickyBuy.classList.remove('hidden');
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(orderSection);
  }

})();
