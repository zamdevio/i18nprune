export {
  DOCTOR_CHECK_IDS,
  collectDoctorFindingsFromInputs,
  doctorExitCode,
  evaluateConfigFinding,
  evaluatePathsFinding,
  evaluateRuntimeFinding,
  evaluateToolsFinding,
} from './findings.js';
export type { DoctorFindingsInputs, DoctorPathsInput } from './findings.js';
export { runDoctor } from './run.js';
export type {
  DoctorCheckId,
  DoctorFinding,
  DoctorHostHooks,
  DoctorJsonPayload,
  DoctorRunOptions,
  DoctorRunResult,
} from '../types/doctor/index.js';
