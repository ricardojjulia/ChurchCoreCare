(() => {
  const NOTICE_ID = 'churchcore-demo-environment-notice';
  const NOTICE_TEXT = 'Synthetic demonstration data only. Do not enter real PHI.';

  async function showDemoNotice() {
    if (document.getElementById(NOTICE_ID)) return;

    const response = await fetch('/api/health', {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return;

    const health = await response.json();
    if (health.demoEnvironment !== true) return;

    const notice = document.createElement('aside');
    notice.id = NOTICE_ID;
    notice.setAttribute('aria-label', 'Demo environment notice');
    notice.setAttribute('role', 'status');
    notice.textContent = NOTICE_TEXT;
    Object.assign(notice.style, {
      background: '#ffffff',
      border: '1px solid #fdba74',
      borderRadius: '10px',
      bottom: '16px',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.16)',
      color: '#7c2d12',
      fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      left: '50%',
      maxWidth: 'calc(100vw - 32px)',
      padding: '10px 16px',
      position: 'fixed',
      textAlign: 'center',
      transform: 'translateX(-50%)',
      width: '520px',
      zIndex: '10000',
    });
    document.body.appendChild(notice);
  }

  showDemoNotice().catch(() => {});
})();
