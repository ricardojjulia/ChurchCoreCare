import { HttpError, readJsonBody, writeJson } from './http.js';

function isValidationError(error) {
  return error instanceof TypeError || error instanceof RangeError;
}

function platformAdminDenied(response, session) {
  if (session?.role === 'platform_admin') return false;
  writeJson(response, 403, { error: 'Platform admin role required' });
  return true;
}

export function createDemoFeedbackHttpHandlers({
  service,
  demoEnabled,
  audit = async () => {},
}) {
  if (!service) throw new TypeError('service is required');

  return {
    async submit(request, response, session) {
      if (request.method !== 'POST') {
        writeJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      if (!demoEnabled) {
        writeJson(response, 404, { error: 'Demo feedback is not available' });
        return;
      }

      try {
        const payload = await readJsonBody(request);
        const result = await service.submit(payload, session);
        writeJson(response, 202, result);
      } catch (error) {
        if (error?.code === 'DEMO_FEEDBACK_RATE_LIMITED') {
          writeJson(response, 429, { error: 'Too many demo feedback submissions' });
          return;
        }
        if (error instanceof HttpError || isValidationError(error)) {
          writeJson(response, error.statusCode ?? 400, { error: error.message });
          return;
        }
        writeJson(response, 500, { error: 'Unable to submit demo feedback' });
      }
    },

    async list(request, response, requestUrl, session) {
      if (request.method !== 'GET') {
        writeJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      if (platformAdminDenied(response, session)) {
        await audit('platform.demo_feedback.read', 'denied', 'rbac_denied');
        return;
      }

      try {
        const items = await service.list({
          view: requestUrl.searchParams.get('view') ?? 'open',
          category: requestUrl.searchParams.get('category') || null,
          identity: requestUrl.searchParams.get('identity') || null,
          from: requestUrl.searchParams.get('from') || null,
          to: requestUrl.searchParams.get('to') || null,
        });
        await audit('platform.demo_feedback.read', 'success', 'ok');
        writeJson(response, 200, { items });
      } catch (error) {
        const validation = isValidationError(error);
        await audit(
          'platform.demo_feedback.read',
          validation ? 'failure' : 'error',
          validation ? 'validation_failed' : 'operation_error',
        );
        writeJson(
          response,
          validation ? 400 : 500,
          { error: validation ? error.message : 'Unable to load demo feedback' },
        );
      }
    },

    async update(request, response, id, session) {
      if (request.method !== 'PATCH') {
        writeJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      if (platformAdminDenied(response, session)) {
        await audit('platform.demo_feedback.update', 'denied', 'rbac_denied');
        return;
      }

      try {
        const patch = await readJsonBody(request);
        const item = await service.updateTriage(id, patch);
        if (!item) {
          await audit('platform.demo_feedback.update', 'failure', 'not_found');
          writeJson(response, 404, { error: 'Demo feedback report not found' });
          return;
        }
        await audit('platform.demo_feedback.update', 'success', 'ok');
        writeJson(response, 200, { item });
      } catch (error) {
        const validation = error instanceof HttpError || isValidationError(error);
        await audit(
          'platform.demo_feedback.update',
          validation ? 'failure' : 'error',
          validation ? 'validation_failed' : 'operation_error',
        );
        writeJson(
          response,
          validation ? (error.statusCode ?? 400) : 500,
          { error: validation ? error.message : 'Unable to update demo feedback' },
        );
      }
    },
  };
}
