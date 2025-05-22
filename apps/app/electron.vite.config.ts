import {ElectronViteConfig} from 'electron-vite';
import react from '@vitejs/plugin-react';

export default {
    main: {
        build: {
            lib: {
                entry: 'src/main.ts',
                formats: ['cjs'],
            },
            outDir: 'dist/main'
        },
    },
    preload: {
        build: {
            lib: {
                entry: 'src/preload.ts',
                formats: ['cjs']
            },
            outDir: 'dist/preload'
        },
    },
    renderer: {
        plugins: [react()],
        build: {
            target: "modules",
            lib: {
                entry: 'src/renderer/index.html',
                formats: ['es'],
            },
            outDir: 'dist/renderer',
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        },
    }
} satisfies ElectronViteConfig
