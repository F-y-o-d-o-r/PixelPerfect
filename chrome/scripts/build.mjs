import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDir, '..')
const isWatchMode = process.argv.includes('--watch')

async function buildBackgroundServiceWorker() {
  await build({
    root: projectRoot,
    mode: isWatchMode ? 'development' : 'production',
    configFile: false,
    publicDir: resolve(projectRoot, 'public'),
    resolve: {
      alias: {
        '@': resolve(projectRoot, 'src'),
      },
    },
    build: {
      outDir: resolve(projectRoot, 'dist'),
      emptyOutDir: true,
      sourcemap: isWatchMode ? 'inline' : true,
      watch: isWatchMode ? {} : null,
      rollupOptions: {
        input: {
          background: resolve(projectRoot, 'src/background/index.ts'),
        },
        output: {
          entryFileNames: '[name].js',
          format: 'es',
        },
      },
    },
  })
}

async function buildContentScriptBundle() {
  await build({
    root: projectRoot,
    mode: isWatchMode ? 'development' : 'production',
    configFile: false,
    publicDir: false,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(projectRoot, 'src'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        isWatchMode ? 'development' : 'production'
      ),
      __DEV__: JSON.stringify(isWatchMode),
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    build: {
      outDir: resolve(projectRoot, 'dist'),
      emptyOutDir: false,
      sourcemap: isWatchMode ? 'inline' : true,
      watch: isWatchMode ? {} : null,
      lib: {
        entry: resolve(projectRoot, 'src/content/index.ts'),
        name: 'PixelPerfectITITI',
        formats: ['iife'],
        fileName: () => 'content.js',
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  })
}

async function runExtensionBuild() {
  await buildBackgroundServiceWorker()
  await buildContentScriptBundle()
}

runExtensionBuild().catch((error) => {
  console.error(error)
  process.exit(1)
})
