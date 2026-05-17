import { describe, it, expect } from 'vitest';
import { scanImportBindings } from '../imports.js';

/** Kitchen-sink source: comment/string/template decoys + real import forms (regression guard). */
const KITCHEN_SINK_BINDINGS_FIXTURE = `
// fake import { t } from 'x'

const str = "import { nope } from 'x'";

const tpl = \`
import { fake } from 'x'
\`;

import { t as translate } from 'x';
import * as i18n from 'x';
import { default as i18n2 } from 'x';

import type { Foo } from 'types';
import { type Bar, t } from 'x';

const { t: cjsT } = require('x');
const mod = require('x');

const dyn = await import('x');
const { t: dynT } = await import('x');

translate();
i18n.t();
i18n?.['t']();
mod.t();
`;

describe('scanImportBindings kitchen sink', () => {
  it('matches snapshot of normalized bindings', () => {
    expect(scanImportBindings(KITCHEN_SINK_BINDINGS_FIXTURE)).toMatchSnapshot();
  });
});
