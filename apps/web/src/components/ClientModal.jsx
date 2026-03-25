import { Modal } from '@mantine/core';
import ClientForm from './ClientForm';

export default function ClientModal({ isOpen, onClose, onSubmit, initialClient = null }) {
  const handleSubmit = (client) => {
    onSubmit(client);
    onClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={initialClient ? 'Edit Client' : 'New Client'}
      size="sm"
    >
      <ClientForm
        initialClient={initialClient}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
