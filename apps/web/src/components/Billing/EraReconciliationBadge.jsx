import { Badge, Tooltip } from '@mantine/core';

const ERA_CONFIG = {
  paid:           { color: 'teal',   label: 'Paid (ERA)' },
  partially_paid: { color: 'yellow', label: 'Partially Paid' },
  denied:         { color: 'red',    label: 'Denied' },
};

export default function EraReconciliationBadge({ status, eraReceivedAt, adjustmentReason }) {
  const cfg = ERA_CONFIG[status];
  if (!cfg) return null;

  const tooltipLabel = [
    eraReceivedAt ? `ERA received: ${new Date(eraReceivedAt).toLocaleDateString()}` : null,
    adjustmentReason ? `Adj. code: ${adjustmentReason}` : null,
  ].filter(Boolean).join(' · ');

  const badge = (
    <Badge color={cfg.color} size="sm" variant="filled">
      {cfg.label}
    </Badge>
  );

  return tooltipLabel ? (
    <Tooltip label={tooltipLabel} withArrow>
      {badge}
    </Tooltip>
  ) : badge;
}
