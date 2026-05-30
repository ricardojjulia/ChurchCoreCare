import { useState } from 'react';
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Text,
} from '@mantine/core';
import { Users } from 'lucide-react';

/**
 * PersonaUpgradeModal
 *
 * Shown when a solo tenant adds their 2nd counselor.
 * Prompts them to switch to Practice mode.
 *
 * After 6 or more dismissals, shows a "Don't show this again" checkbox.
 *
 * @param {{
 *   opened: boolean,
 *   dismissCount: number,
 *   onDismiss: () => void,
 *   onConfirm: () => void,
 *   onMute: () => void,
 * }} props
 */
export default function PersonaUpgradeModal({
  opened,
  dismissCount = 0,
  onDismiss,
  onConfirm,
  onMute,
}) {
  const [muteChecked, setMuteChecked] = useState(false);

  const showMuteOption = dismissCount >= 6;

  const handleMuteChange = (event) => {
    const checked = event.currentTarget.checked;
    setMuteChecked(checked);
    if (checked) {
      onMute();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onDismiss}
      title={
        <Group gap="sm">
          <Users size={20} />
          <Text fw={700} fz="lg">
            {`You're building a team!`}
          </Text>
        </Group>
      }
      size="md"
      centered
      data-testid="persona-upgrade-modal"
    >
      <Stack gap="md">
        <Text fz="sm" c="dimmed">
          Switch to Practice mode to unlock staff management, multiple
          locations, and the full Workspace Studio. You can always switch back
          in Settings.
        </Text>

        <Group justify="flex-end" gap="xs">
          <Button
            variant="subtle"
            onClick={onDismiss}
            data-testid="persona-upgrade-not-yet"
          >
            Not yet
          </Button>
          <Button
            onClick={onConfirm}
            data-testid="persona-upgrade-confirm"
          >
            Switch to Practice mode
          </Button>
        </Group>

        {showMuteOption && (
          <Checkbox
            label="Don't show this again"
            checked={muteChecked}
            onChange={handleMuteChange}
            mt="xs"
            data-testid="persona-upgrade-mute"
          />
        )}
      </Stack>
    </Modal>
  );
}
