import { arch, hostname, platform, release, type } from 'node:os';
import type { HostInfo } from './types.js';

export interface HostInfoOptions {
  readonly includeHostname?: boolean;
  readonly claudeVersion?: string;
}

/** Collect non-identifying host information. Hostname is opt-in. */
export function getHostInfo(options: HostInfoOptions = {}): HostInfo {
  return {
    os: `${type()} ${release()}`,
    platform: platform(),
    arch: arch(),
    nodeVersion: process.version,
    ...(options.claudeVersion ? { claudeVersion: options.claudeVersion } : {}),
    ...(options.includeHostname ? { hostname: hostname() } : {}),
  };
}
