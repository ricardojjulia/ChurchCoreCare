import { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  Badge,
  Box,
  Checkbox,
  Code,
  Drawer,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { api } from '../lib/api.js';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'BUG', label: 'Bug' },
  { value: 'ERROR', label: 'Error' },
  { value: 'UNEXPECTED_RESULT', label: 'Unexpected result' },
  { value: 'IMPROVEMENT', label: 'Improvement' },
];

const ACTION_OPTIONS = [
  { value: 'code_fixed', label: 'Code fixed' },
  { value: 'update_applied', label: 'Update applied' },
  { value: 'suggestion_not_implemented', label: 'Suggestion not implemented' },
  { value: 'suggestion_implemented', label: 'Suggestion implemented' },
  { value: 'bug_fixed', label: 'Bug fixed' },
  { value: 'error_fixed', label: 'Error fixed' },
  { value: 'received_and_closed', label: 'Received and closed' },
];

const CATEGORY_COLORS = {
  BUG: 'red',
  ERROR: 'orange',
  UNEXPECTED_RESULT: 'yellow',
  IMPROVEMENT: 'blue',
};

export default function DemoFeedbackPage() {
  const [view, setView] = useState('open');
  const [category, setCategory] = useState('');
  const [identity, setIdentity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listDemoFeedback({ view, category, identity, from, to });
      setItems(result.items ?? []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [view, category, identity, from, to]);

  useEffect(() => {
    const timer = window.setTimeout(load, 150);
    return () => window.clearTimeout(timer);
  }, [load]);

  const updateDemoFeedback = async (item, patch) => {
    const previousItems = items;
    const optimistic = { ...item, ...patch };
    setItems((current) => current.map((entry) => entry.id === item.id ? optimistic : entry));
    setSelected((current) => current?.id === item.id ? optimistic : current);
    try {
      const result = await api.updateDemoFeedback(item.id, {
        processed: patch.processed ?? item.processed,
        action: patch.action === undefined ? item.action : patch.action,
      });
      setItems((current) => current.map((entry) => entry.id === item.id ? result.item : entry));
      setSelected((current) => current?.id === item.id ? result.item : current);
    } catch (updateError) {
      setItems(previousItems);
      setSelected(item);
      notifications.show({
        color: 'red',
        title: 'Triage update failed',
        message: updateError.message,
      });
    }
  };

  return (
    <Stack>
      <Box>
        <Title order={2}>Demo Feedback</Title>
        <Text c="dimmed">Review reported demo issues and improvement ideas.</Text>
      </Box>

      <Paper p="md" withBorder>
        <Stack>
          <Tabs value={view} onChange={(value) => setView(value || 'open')}>
            <Tabs.List>
              <Tabs.Tab value="open">Open</Tabs.Tab>
              <Tabs.Tab value="done">Done</Tabs.Tab>
              <Tabs.Tab value="all">All</Tabs.Tab>
            </Tabs.List>
          </Tabs>
          <Group align="end" grow>
            <Select label="Category" data={CATEGORY_OPTIONS} value={category} onChange={(value) => setCategory(value || '')} />
            <TextInput label="Email or role" value={identity} onChange={(event) => setIdentity(event.currentTarget.value)} />
            <TextInput label="From" type="date" value={from} onChange={(event) => setFrom(event.currentTarget.value)} />
            <TextInput label="To" type="date" value={to} onChange={(event) => setTo(event.currentTarget.value)} />
          </Group>
        </Stack>
      </Paper>

      {loading ? (
        <Group justify="center" p="xl"><Loader /></Group>
      ) : error ? (
        <Paper p="xl" withBorder><Text c="red">{error}</Text></Paper>
      ) : items.length === 0 ? (
        <Paper p="xl" withBorder><Text c="dimmed">No demo feedback reports match these filters.</Text></Paper>
      ) : (
        <Paper withBorder>
          <Table.ScrollContainer minWidth={900}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Received</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Route</Table.Th>
                  <Table.Th>Reporter</Table.Th>
                  <Table.Th>Preview</Table.Th>
                  <Table.Th>Hits</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item) => (
                  <Table.Tr
                    key={item.id}
                    tabIndex={0}
                    aria-label={`Open ${item.category.toLowerCase()} report for ${item.route}`}
                    onClick={() => setSelected(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(item);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td><Badge color={item.processed ? 'green' : 'gray'}>{item.processed ? 'Done' : 'Open'}</Badge></Table.Td>
                    <Table.Td>{new Date(item.createdAt).toLocaleString()}</Table.Td>
                    <Table.Td><Badge color={CATEGORY_COLORS[item.category]}>{item.category}</Badge></Table.Td>
                    <Table.Td><Code>{item.route}</Code></Table.Td>
                    <Table.Td>{item.userEmail || item.userRole || 'Anonymous'}</Table.Td>
                    <Table.Td>{(item.note || item.errorMessage || 'No details').slice(0, 100)}</Table.Td>
                    <Table.Td>{item.hitCount}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      <Drawer
        opened={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Demo feedback details"
        position="right"
        size="lg"
      >
        {selected ? (
          <Stack>
            <Text><strong>Submitted:</strong> {new Date(selected.createdAt).toLocaleString()}</Text>
            <Text><strong>User:</strong> {selected.userEmail || 'Anonymous'} ({selected.userRole || 'no role'})</Text>
            <Text><strong>Session duration:</strong> {selected.sessionDurationSeconds ?? 0} seconds</Text>
            <Text><strong>Duplicate hits:</strong> {selected.hitCount}</Text>
            <Text><strong>Route:</strong> <Code>{selected.route}</Code></Text>
            <Text><strong>Breadcrumbs:</strong> {(selected.breadcrumbs || []).join(' -> ') || 'None'}</Text>
            <Text><strong>Note:</strong> {selected.note || 'None'}</Text>
            <Text><strong>Safe error message:</strong> {selected.errorMessage || 'None'}</Text>
            <Select
              clearable
              label="Resolution action"
              data={ACTION_OPTIONS}
              value={selected.action}
              onChange={(action) => updateDemoFeedback(selected, { action })}
            />
            <Checkbox
              label="Processed"
              checked={selected.processed}
              onChange={(event) => updateDemoFeedback(selected, { processed: event.currentTarget.checked })}
            />
            <Accordion>
              <Accordion.Item value="raw">
                <Accordion.Control>Raw diagnostic JSON</Accordion.Control>
                <Accordion.Panel>
                  <Code block>{JSON.stringify({
                    id: selected.id,
                    route: selected.route,
                    category: selected.category,
                    breadcrumbs: selected.breadcrumbs,
                    demoVersion: selected.demoVersion,
                    sessionDurationSeconds: selected.sessionDurationSeconds,
                    hitCount: selected.hitCount,
                    metadata: selected.metadata,
                    processed: selected.processed,
                    action: selected.action,
                    createdAt: selected.createdAt,
                    updatedAt: selected.updatedAt,
                  }, null, 2)}</Code>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        ) : null}
      </Drawer>
    </Stack>
  );
}
