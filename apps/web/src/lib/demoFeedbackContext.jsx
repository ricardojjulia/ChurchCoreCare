import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { getCsrfToken } from './csrf.js';
import {
  buildDemoFeedbackPayload,
  createDemoSessionController,
  submitDemoFeedback,
} from './demoFeedback.js';

const DEMO_ENABLED = import.meta.env.VITE_DEMO_ENVIRONMENT === 'true';
const DEMO_VERSION = import.meta.env.VITE_DEMO_VERSION ?? import.meta.env.VITE_APP_VERSION ?? '';

export const DemoSessionContext = createContext({
  enabled: false,
  recordRoute() {},
  async reportFeedback() { return null; },
  async reportError() { return null; },
});

export function DemoSessionProvider({ children }) {
  const currentRoute = useRef('/');
  const controller = useMemo(() => createDemoSessionController({
    enabled: DEMO_ENABLED,
    storage: typeof window === 'undefined' ? undefined : window.sessionStorage,
  }), []);

  const recordRoute = useCallback((route) => {
    currentRoute.current = route;
    controller.recordRoute(route);
  }, [controller]);

  const send = useCallback(async ({
    route,
    category,
    note = null,
    errorMessage = null,
    swallowErrors = false,
  }) => {
    if (!controller.enabled) return null;
    const payload = buildDemoFeedbackPayload({
      session: controller.snapshot(),
      route: route || currentRoute.current,
      category,
      note,
      errorMessage,
      demoVersion: DEMO_VERSION,
    });
    return submitDemoFeedback(payload, {
      csrfToken: getCsrfToken(),
      swallowErrors,
    });
  }, [controller]);

  const value = useMemo(() => ({
    enabled: controller.enabled,
    recordRoute,
    reportFeedback: (input) => send(input),
    reportError: ({ route, errorMessage }) => send({
      route,
      category: 'ERROR',
      errorMessage,
      swallowErrors: true,
    }),
  }), [controller.enabled, recordRoute, send]);

  return (
    <DemoSessionContext.Provider value={value}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  return useContext(DemoSessionContext);
}
