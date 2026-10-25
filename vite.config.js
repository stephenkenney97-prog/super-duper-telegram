import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const mock = fileURLToPath(new URL('./smoke/firebase.js', import.meta.url));
export default defineConfig({build:{target:'esnext'},esbuild:{jsx:'automatic'},resolve:{alias:{'firebase/app':mock,'firebase/auth':mock,'firebase/firestore':mock}},server:{host:'127.0.0.1'},preview:{host:'127.0.0.1'}});
