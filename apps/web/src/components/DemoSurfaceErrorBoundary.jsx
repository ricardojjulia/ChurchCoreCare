import { Component, useContext } from 'react';
import { Alert, Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { AlertTriangle } from 'lucide-react';
import { DemoSessionContext } from '../lib/demoFeedbackContext.jsx';

export class ActiveDemoSurfaceErrorBoundary extends Component {
  static contextType = DemoSessionContext;

  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    this.context.reportError({
      route: this.props.route,
      errorMessage: String(error?.message || 'Unhandled render error').slice(0, 4_000),
    });
    notifications.show({
      color: 'orange',
      title: 'Demo error captured',
      message: 'The current screen could not finish rendering. The rest of the application remains available.',
    });
  }

  componentDidUpdate(previousProps) {
    if (this.state.failed && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Stack p="xl">
        <Alert color="orange" icon={<AlertTriangle size={18} />} title="This screen encountered an error">
          <Text size="sm">
            The error was captured for platform review. You can continue using navigation or retry this screen.
          </Text>
        </Alert>
        <Button variant="light" onClick={() => this.setState({ failed: false })}>
          Retry screen
        </Button>
      </Stack>
    );
  }
}

export default function DemoSurfaceErrorBoundary(props) {
  const demoSession = useContext(DemoSessionContext);
  if (!demoSession.enabled) return props.children;
  return <ActiveDemoSurfaceErrorBoundary {...props} />;
}
