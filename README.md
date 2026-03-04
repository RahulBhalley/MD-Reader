# MD-Reader

A simple, elegant Markdown reader built with Electron, TypeScript, and Vite — optimised for macOS.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (bundled with Node.js)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RahulBhalley/MD-Reader.git
   cd MD-Reader
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Development & Hot Reloading

Start the app in development mode with Vite's Hot Module Replacement (HMR):

```bash
npm start
```

- **Renderer process** — Changes to `src/renderer.ts`, `index.html`, or `src/index.css` trigger near-instant UI updates.
- **Main process** — Changes to `src/index.ts` or `forge.config.ts` automatically recompile and restart Electron.

## Building and Packaging

Package the app into a distributable for all configured platforms:

```bash
npm run make
```

### macOS Specific Build

Generates both a `.dmg` installer and a `.app` bundle:

```bash
npm run make:macos
```

Output is placed in the `out/` directory.

## Publishing Updates to Users

This app uses [`electron-updater`](https://www.electron.build/auto-update) to deliver automatic updates via **GitHub Releases**. When a packaged app starts, it silently checks for a newer version. Users can also trigger a manual check via **App Menu → Check for Updates...**.

### How It Works

1. `electron-forge publish` builds the app and uploads the artifacts (`.dmg`, `.zip`, `latest-mac.yml`) to a GitHub Release as a **draft**.
2. `electron-updater` reads `latest-mac.yml` from the release to determine if a newer version exists.
3. If an update is found, it is downloaded automatically in the background. The user is prompted to restart when ready.

### Steps to Publish a New Version

1. **Bump the version** in `package.json`:
   ```bash
   npm version patch   # or: minor / major
   ```

2. **Export your GitHub token** (needs `repo` scope — create one at [github.com/settings/tokens](https://github.com/settings/tokens)):
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   ```

3. **Run the publish script:**
   ```bash
   npm run release
   # or directly: ./scripts/publish.sh
   ```
   The script validates your token, shows the version, asks for confirmation, then runs `electron-forge publish` — which builds the platform artifacts and uploads them to a **draft** GitHub Release.

4. **Review and publish the draft release** on [github.com/RahulBhalley/MD-Reader/releases](https://github.com/RahulBhalley/MD-Reader/releases).
   - Once published (not draft), existing app installations will detect the update on their next check.

> **Note:** For macOS auto-updates to work silently (without a security prompt), the app must be **code-signed and notarised**. Set `APPLE_ID`, `APPLE_ID_PASSWORD`, and `APPLE_TEAM_ID` environment variables before running `npm run publish`.

## Project Structure

| Path | Description |
|------|-------------|
| `src/index.ts` | **Main process** — app lifecycle, window creation, auto-updater, IPC handlers |
| `src/preload.ts` | **Preload script** — secure bridge between main and renderer via `contextBridge` |
| `src/renderer.ts` | **Renderer process** — UI logic |
| `index.html` | Root HTML entry point (Vite root) |
| `src/index.css` | Global styles |
| `forge.config.ts` | Electron Forge configuration (makers, publishers, plugins) |
| `vite.main.config.ts` | Vite config for the main process |
| `vite.preload.config.ts` | Vite config for the preload script |
| `vite.renderer.config.ts` | Vite config for the renderer process |
| `vite.base.config.ts` | Shared Vite base configuration |
| `tsconfig.json` | TypeScript configuration |
| `scripts/publish.sh` | Release script — validates `GITHUB_TOKEN`, confirms version, then runs `electron-forge publish` to upload a draft release to GitHub |
| `resources/app-update.yml` | Update feed config for `electron-updater` — packaged into `Contents/Resources/` by Forge so the updater can find its GitHub source at runtime |
| `entitlements.plist` | macOS entitlements for code signing |
| `.editorconfig` | Consistent coding styles across editors |
| `.vscode/` | Recommended VS Code extensions and settings |

## Dependencies

### Runtime (`dependencies`)

| Package | Version | Purpose |
|---------|---------|---------|
| [`electron-updater`](https://www.npmjs.com/package/electron-updater) | `^6.8.3` | Auto-update support via GitHub Releases |
| [`electron-squirrel-startup`](https://www.npmjs.com/package/electron-squirrel-startup) | `^1.0.1` | Handles Squirrel installer events on Windows (install/uninstall shortcuts) |
| [`marked`](https://www.npmjs.com/package/marked) | `^17.0.3` | Fast Markdown parser and renderer |
| [`drag-drop`](https://www.npmjs.com/package/drag-drop) | `^7.2.0` | Drag-and-drop file handling in the browser context |

### Dev Dependencies (`devDependencies`)

| Package | Version | Purpose |
|---------|---------|---------|
| [`electron`](https://www.npmjs.com/package/electron) | `^40.6.1` | Electron runtime |
| [`@electron-forge/cli`](https://www.npmjs.com/package/@electron-forge/cli) | `^7.11.1` | Electron Forge CLI — build, package, publish |
| [`@electron-forge/maker-dmg`](https://www.npmjs.com/package/@electron-forge/maker-dmg) | `^7.11.1` | Creates `.dmg` installers for macOS |
| [`@electron-forge/maker-zip`](https://www.npmjs.com/package/@electron-forge/maker-zip) | `^7.11.1` | Creates `.zip` archives |
| [`@electron-forge/maker-deb`](https://www.npmjs.com/package/@electron-forge/maker-deb) | `^7.11.1` | Creates `.deb` packages for Linux |
| [`@electron-forge/maker-rpm`](https://www.npmjs.com/package/@electron-forge/maker-rpm) | `^7.11.1` | Creates `.rpm` packages for Linux |
| [`@electron-forge/maker-squirrel`](https://www.npmjs.com/package/@electron-forge/maker-squirrel) | `^7.11.1` | Creates Squirrel-based `.exe` installers for Windows |
| [`@electron-forge/publisher-github`](https://www.npmjs.com/package/@electron-forge/publisher-github) | `^7.x` | Publishes release artifacts to GitHub Releases |
| [`@electron-forge/plugin-vite`](https://www.npmjs.com/package/@electron-forge/plugin-vite) | `^7.11.1` | Integrates Vite as the bundler for main/renderer/preload |
| [`@electron-forge/plugin-auto-unpack-natives`](https://www.npmjs.com/package/@electron-forge/plugin-auto-unpack-natives) | `^7.11.1` | Auto-unpacks native Node.js modules from ASAR |
| [`@electron-forge/plugin-fuses`](https://www.npmjs.com/package/@electron-forge/plugin-fuses) | `^7.11.1` | Configures Electron Fuses (security feature flags) |
| [`@electron-forge/template-vite-typescript`](https://www.npmjs.com/package/@electron-forge/template-vite-typescript) | `^7.11.1` | Project template (used during scaffolding) |
| [`@electron/fuses`](https://www.npmjs.com/package/@electron/fuses) | `^1.8.0` | Types/constants for Electron Fuse configuration |
| [`vite`](https://www.npmjs.com/package/vite) | `^7.3.1` | Frontend build tool with HMR |
| [`typescript`](https://www.npmjs.com/package/typescript) | `^5.9.3` | TypeScript compiler |
| [`@typescript-eslint/eslint-plugin`](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) | `^5.62.0` | ESLint plugin for TypeScript-specific rules |
| [`@typescript-eslint/parser`](https://www.npmjs.com/package/@typescript-eslint/parser) | `^5.62.0` | TypeScript parser for ESLint |
| [`eslint`](https://www.npmjs.com/package/eslint) | `^8.57.1` | JavaScript/TypeScript linter |
| [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import) | `^2.32.0` | ESLint plugin to lint ES module import/export syntax |
| [`@types/marked`](https://www.npmjs.com/package/@types/marked) | `^5.0.2` | TypeScript types for `marked` |

## Linting

Check the code for errors:

```bash
npm run lint
```

VS Code users: the project auto-formats and lints on save via ESLint (see `.vscode/` settings).

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
