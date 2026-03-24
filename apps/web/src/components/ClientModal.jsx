import ClientForm from './ClientForm';

export default function ClientModal({ isOpen, onClose, onSubmit, initialClient = null }) {
  if (!isOpen) return null;

  const handleSubmit = (client) => {
    onSubmit(client);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>
          {initialClient ? 'Edit Client' : 'New Client'}
        </h2>
        <ClientForm
          initialClient={initialClient}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
