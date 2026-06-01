export type LocalesSourceInputKind = 'language_code' | 'path' | 'json_filename' | 'invalid_shape';

export type LocalesSourceValidationResult =
  | { ok: true; code: string }
  | { ok: false; issueCode: string; message: string };
