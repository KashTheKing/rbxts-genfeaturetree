# rbxts-genfeaturetree

Automatically generates a Rojo `default.project.json` from your roblox-ts compiled output, mapping files to the correct Roblox services based on filename suffix.

## Installation

```bash
npm install rbxts-genfeaturetree
```

Installing the package automatically patches your `build` and `watch` scripts in `package.json` and creates `src/core/` and `src/features/` if they don't exist.

## File Routing

Files in `out/` are routed based on their suffix:

| Suffix | Roblox Service |
|---|---|
| `-server.luau` | `ServerScriptService` |
| `-client.luau` | `ReplicatedStorage` |
| `.luau` | `ReplicatedStorage` |

Folder hierarchy is preserved. `out/features/combat/ability-server.luau` becomes `ServerScriptService/features/combat/ability`.

## Scripts

After install, your `package.json` will have:

```json
"build": "rbxtsc && node node_modules/rbxts-genfeaturetree/genFeatureTree.js",
"watch": "concurrently \"rbxtsc -w\" \"nodemon --watch out --ext luau --exec 'node node_modules/rbxts-genfeaturetree/genFeatureTree.js'\""
```

- `npm run build` — compiles TypeScript and regenerates `default.project.json`
- `npm run watch` — watches for changes and keeps `default.project.json` in sync

## Init

To scaffold a fresh project structure:

```bash
node node_modules/rbxts-genfeaturetree/setup.js --init
```

This will:
- Create `src/core/server/`, `src/core/client/`, `src/core/shared/`, and `src/features/`
- Move `main-server.ts` and `main-client.ts` from `src/` into their respective folders
- Write a fresh `default.project.json` wired to the new structure
