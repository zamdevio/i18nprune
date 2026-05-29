/** Vue SFC stack smoke — `.vue` with `t()` in `<script setup>`. */
import { fixtureTranslate } from '../../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'locales/en.json',
    directory: 'locales',
    mode: 'flat_file',
    structure: 'locale_file',
  },
  src: 'src',
  functions: ['t'],
  translate: fixtureTranslate,
  policies: { preserve: {}, parity: {} },
};
