# API Reference

Every `@cem/*` package exposes a small, typed public API from its `src/index.ts`. Import types with
`import type` to keep them out of runtime bundles.

## `@cem/shared`

```ts
import { ok, err, isOk, tryCatch, CemError, ValidationError, createLogger,
         formatBytes, formatNumber, slugify, walk, readJson, writeJson,
         pathExists, ensureDir } from '@cem/shared';
```

- `Result<T,E>` helpers: `ok`, `err`, `isOk`, `isErr`, `unwrap`, `mapResult`, `tryCatch`.
- Errors: `CemError` + `ValidationError`, `NotFoundError`, `IntegrityError`, `CryptoError`,
  `BackupError`, `RestoreError`, `ScannerError`, `UnsupportedVersionError`.
- `Logger` / `createLogger({ level, capture, silent })`.
- FS: `walk`, `readJson/writeJson`, `readText/writeText`, `pathExists`, `ensureDir`, `expandHome`.

## `@cem/core`

```ts
import { getKnownUserLocations, getProjectLocations, getClaudeDesktopConfigPath,
         estimateTokens, summarizeArtifacts, isFormatSupported, categoryDirForKind,
         loadConfig, saveConfig, getHostInfo } from '@cem/core';
```

Key types: `ScannedArtifact`, `ScanResult`, `McpServerDefinition`, `SkillMetadata`,
`AgentMetadata`, `MarkdownStats`, `Profile`, `CemManifest`, `CemEntry`, `RestoreTarget`.

## `@cem/crypto`

```ts
import { sha256, sha256File, deriveKey, generateSalt, encrypt, decrypt,
         generateKeyPair, signData, verifyData } from '@cem/crypto';

const env = await encrypt(Buffer.from('secret'), 'password');   // AES-256-GCM + Argon2id
const clear = await decrypt(header, env.ciphertext, 'password');
```

## `@cem/scanner`

```ts
import { scanEnvironment, discoverProjectRoots, filterArtifacts,
         countByKind, totalTokens } from '@cem/scanner';

const result = await scanEnvironment({ home, computeTokens: true }); // READ-ONLY
```

## `@cem/markdown`

```ts
import { analyzeMarkdown, extractReferences, detectOverlaps,
         buildTokenReport } from '@cem/markdown';
```

## `@cem/mcp`

```ts
import { discoverMcpServers, redactServers, serversToMcpJson, hasSecrets } from '@cem/mcp';
```

## `@cem/profiles`

```ts
import { createProfile, matchesProfile, applyProfile, saveProfile,
         loadProfiles, deleteProfile, PROFILE_TEMPLATES } from '@cem/profiles';
```

## `@cem/diagnostics`

```ts
import { runDiagnostics, diagnoseEnvironment, tokenRollup } from '@cem/diagnostics';
const diagnosis = await diagnoseEnvironment({ home });
```

## `@cem/backup`

```ts
import { backupEnvironment, createBackup, planArtifacts } from '@cem/backup';

const result = await backupEnvironment({ home, outDir, password }); // -> BackupResult
```

## `@cem/restore`

```ts
import { readManifest, readCemArchive, verifyArchive,
         computeRestoreTargets, restoreArchive, restoreFromFile } from '@cem/restore';

const { verify, result } = await restoreFromFile('backup.cem', { home, password });
```

All async functions reject with a `CemError` subclass carrying a stable `.code`.
