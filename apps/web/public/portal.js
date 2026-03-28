function getCookie(name) {
  const pairs = document.cookie.split(';').map((part) => part.trim());
  for (const pair of pairs) {
    if (!pair.startsWith(`${name}=`)) continue;
    return decodeURIComponent(pair.slice(name.length + 1));
  }
  return '';
}

function setStatus(message, type = '') {
  const el = document.getElementById('portalRequestStatus');
  if (!el) return;
  el.textContent = message;
  el.className = `portal-status ${type}`.trim();
}

async function submitRequest(payload) {
  const csrfToken = getCookie('csrf_token');
  const response = await fetch('/api/v1/portal/public-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || `Request failed (${response.status})`);
  }
  return body;
}

function collectServices(formEl) {
  return [...formEl.querySelectorAll('.portal-services input[type="checkbox"]')]
    .filter((el) => el.checked)
    .map((el) => el.value);
}

const form = document.getElementById('portalRequestForm');
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const firstName = String(document.getElementById('firstName')?.value || '').trim();
    const lastName = String(document.getElementById('lastName')?.value || '').trim();
    const email = String(document.getElementById('email')?.value || '').trim();
    const phone = String(document.getElementById('phone')?.value || '').trim();
    const notes = String(document.getElementById('notes')?.value || '').trim();
    const requestedServices = collectServices(form);

    if (!firstName || !lastName || !email) {
      setStatus('First name, last name, and email are required.', 'error');
      return;
    }

    setStatus('Submitting request...');

    try {
      await submitRequest({
        firstName,
        lastName,
        email,
        phone,
        requestedServices,
        notes,
      });
      form.reset();
      setStatus('Request submitted successfully. Our team will contact you soon.', 'success');
    } catch (error) {
      setStatus(error?.message || 'Unable to submit request at this time.', 'error');
    }
  });
}
