#!/usr/bin/env node

import { runCli } from '../src/run.js';

process.exitCode = await runCli();
