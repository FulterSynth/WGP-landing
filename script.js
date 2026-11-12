/* =========================================================
   WGP ДБЖ — script.js (зв'язок через Make Webhook)
   ========================================================= */

(function () {
  'use strict';

  // Твоє посилання на вебхук у Make
  const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/hmmvr88wndy4t4h026hmkkbwmene7bjk';

  const form = document.getElementById('orderForm');
  const submitBtn = document.getElementById('submitBtn');
  const formNote = document.getElementById('formNote');
  const stickyBuy = document.getElementById('stickyBuy');
  const orderSection = document.getElementById('order');

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

  async function submitOrder(data) {
    const phone = normalizePhone(data.phone);

    const payload = {
      product: 'ДБЖ WGP для роутера',
      price: 1390,
      name: data.name,
      phone: phone,
      comment: data.comment || ''
    };

    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }
  }

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
        showNote('Помилка відправки. Спробуйте ще раз.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

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
