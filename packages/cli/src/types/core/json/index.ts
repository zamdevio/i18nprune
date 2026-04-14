/** One string leaf in a JSON tree (`a[0].b` style paths). */
export type StringLeaf = {
  path: string;
  value: string;
};

export type {
  CliJsonEnvelope,
  ErrResult,
  Issue,
  IssueSeverity,
  OkResult,
  Result,
  ResultMeta,
} from './envelope.js';
