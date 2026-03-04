# MD-Reader

A simple Electron application built with TypeScript and Webpack, optimized for macOS.

## Prerequisites

Before you begin, ensure you have the following installed on your macOS:
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Getting Started

1. **Clone the repository (if applicable):**
   ```bash
   git clone <repository-url>
   cd MD-Reader
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Development

To start the application in development mode with live reloading and Chrome DevTools:

```bash
npm start
```

This command uses [Electron Forge](https://www.electronforge.io/) to compile your TypeScript code via Webpack and launch the Electron process.

## Building and Packaging

To package the application into a distributable format for all configured platforms:

```bash
npm run make
```

### macOS Specific Build
To specifically build for macOS (generates both `.dmg` and `.app` files):

```bash
npm run make:macos
```

The output will be located in the `out/` directory.

## Project Structure

- `src/index.ts`: The **Main Process**. Controls the app lifecycle and creates browser windows.
- `src/renderer.ts`: The **Renderer Process**. Handles the UI logic (imported into `index.html`).
- `src/preload.ts`: The **Preload Script**. A secure bridge between the main and renderer processes.
- `src/index.html`: The main entry point for the UI.
- `src/index.css`: Global styles for the application.
- `forge.config.ts`: Configuration for Electron Forge (build settings, makers, plugins).
- `tsconfig.json`: TypeScript configuration.
- `webpack.*.config.ts`: Webpack configurations for the main and renderer processes.
- `.vscode/`: Recommended VS Code extensions and settings for automatic formatting.
- `.editorconfig`: Consistent coding styles across editors.
- `LICENSE`: MIT License.

## Linting and Formatting

To check the code for potential errors:
```bash
npm run lint
```

If you are using VS Code, the project is configured to automatically format and lint your code on save using ESLint and Prettier.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
