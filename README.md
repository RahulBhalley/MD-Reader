# MD-Reader

A simple Electron application built with TypeScript and Webpack.

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

To package the application into a distributable format (e.g., a `.app` or `.dmg` for macOS):

```bash
npm run make
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

## Linting

To check the code for potential errors and style issues:

```bash
npm run lint
```

## License

This project is licensed under the MIT License - see the [package.json](package.json) file for details.
