import { GovernanceError } from '@localization-governance/core';
import { loadConfigFile } from './config.js';
import { formatResult } from './format.js';

function parse(argv) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return { positional, flags };
}

function requireFlag(flags, name) {
  if (!flags[name]) throw new GovernanceError('invalid_command', `--${name} is required.`);
  return flags[name];
}

async function execute(service, config, parsed) {
  const [command, subcommand, locale] = parsed.positional;
  const actor = config.actor;

  if (command === 'locale' && subcommand === 'create' && locale) {
    return service.createLocale({
      code: locale,
      sourceLocale: parsed.flags.source ?? config.sourceLocale ?? 'en-US',
      actor,
    });
  }
  if (command === 'translate' && subcommand) {
    return service.translateVersion({
      versionId: requireFlag(parsed.flags, 'version'),
      provider: parsed.flags.provider ?? config.defaultProvider ?? 'google',
      scope: parsed.flags.scope ?? 'missing',
      actor,
    });
  }
  if (command === 'validate' && subcommand) {
    return service.validateVersion({
      versionId: requireFlag(parsed.flags, 'version'),
      actor,
      glossary: config.glossaries?.[subcommand] ?? {},
      untranslatedAllowlist: config.untranslatedAllowlist ?? [],
    });
  }
  if (command === 'review' && subcommand === 'request' && locale) {
    return service.requestReview({
      versionId: requireFlag(parsed.flags, 'version'),
      actor,
    });
  }
  if (command === 'review' && subcommand === 'submit' && locale) {
    return service.submitReview({
      versionId: requireFlag(parsed.flags, 'version'),
      reviewer: {
        ...(config.reviewer ?? actor),
        role: parsed.flags.role ?? config.reviewer?.role,
      },
      decision: requireFlag(parsed.flags, 'decision'),
      comment: parsed.flags.comment ?? '',
    });
  }
  if (command === 'approve' && subcommand) {
    return service.approveVersion({
      versionId: requireFlag(parsed.flags, 'version'),
      actor,
    });
  }
  if (command === 'activate' && subcommand) {
    return service.activateVersion({
      versionId: requireFlag(parsed.flags, 'version'),
      actor,
    });
  }
  if (command === 'rollback' && subcommand) {
    return service.rollbackLocale({
      locale: subcommand,
      toVersionId: requireFlag(parsed.flags, 'to'),
      actor,
    });
  }
  if (command === 'status' && subcommand) {
    return service.getLocaleStatus(subcommand);
  }
  if (command === 'ci') {
    return service.evaluateCiPolicy({
      requiredLocales: config.requiredLocales ?? [],
    });
  }
  throw new GovernanceError('invalid_command', 'Unknown or incomplete command.');
}

export async function runCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const stdout = options.stdout ?? ((value) => console.log(value));
  const stderr = options.stderr ?? ((value) => console.error(value));
  const parsed = parse(argv);
  const json = Boolean(parsed.flags.json);
  try {
    const loadConfig = options.loadConfig ?? (() => loadConfigFile(parsed.flags.config));
    const config = await loadConfig();
    const result = await execute(config.service, config, parsed);
    stdout(formatResult(result, json));
    if (parsed.positional[0] === 'ci' && result?.passed === false) return 1;
    return 0;
  } catch (error) {
    const payload = {
      error: error.code ?? 'unexpected_error',
      message: error.message,
    };
    stderr(formatResult(payload, json));
    if (error.code === 'invalid_command') return 2;
    if (['storage_failure', 'provider_failure'].includes(error.code)) return 3;
    return error instanceof GovernanceError ? 1 : 3;
  }
}
