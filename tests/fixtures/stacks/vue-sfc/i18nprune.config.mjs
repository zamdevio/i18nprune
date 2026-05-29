/** Vue SFC stack smoke — `.vue` with `t()` in `<script setup>`. */
export default {
  locales: {
    source: 'locales/en.json',
    directory: 'locales',
  },
  src: 'src',
  functions: ['t'],
  policies: { preserve: {}, parity: {} },
};
