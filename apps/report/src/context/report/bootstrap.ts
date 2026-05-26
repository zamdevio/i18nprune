import { createContext } from 'react';
import type { ReportBootstrap } from '../../types/report/index.js';

export const ReportBootstrapContext = createContext<ReportBootstrap | null>(null);
