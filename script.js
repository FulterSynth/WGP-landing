/* =========================================================
   WGP ДБЖ — script.js (пряма відправка в KeyCRM)
   ========================================================= */

(function () {
  'use strict';

  // ⚠️ КЛЮЧ KEYCRM (буде видний у коді — це для старту)
  const KEYCRM_API_KEY = 'MzE4ZmM5OTczY2Y4NGRhODNiNWQxZWRhZTBlYzRiMjliZjBmZmIyNg';
  const KEYCRM_SOURCE_ID = 1;

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
      title: 'Замовлення WGP — ' + data.name,
      source_id: KEYCRM_SOURCE_ID,
      manager_comment: data.comment || '',
      contact: {
        full_name: data.name,
        phone: phone
      }
    };

    // ПРЯМА ВІДПРАВКА В KEYCRM
    const res = await fetch('https://openapi.keycrm.app/v1/pipelines/cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + KEYCRM_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text().catch(function () { return ''; });
      throw new Error('HTTP ' + res.status + ': ' + text);
    }

    return res.json().catch(function () { return {}; });
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
