export interface ScrapeScraperResult {
  nome: string;
  ok: boolean;
  duration_s: number;
  detail: string;
  stderr: string;
}

export interface ScrapeCsvSummary {
  fonte: string;
  ok: boolean;
  total: number;
  duplicados: number;
  sem_preco: number;
  eventos_passados: number;
  sem_imagem: number;
  erros_encoding: number;
  erros: string[];
}

export interface ScrapeImportSummary {
  ok: boolean;
  novos: number;
  atualizados: number;
}

export interface ScrapeReport {
  started_at: string | null;
  finished_at: string | null;
  scrapers: ScrapeScraperResult[];
  csvs: ScrapeCsvSummary[];
  /** Preenchido quando a importação ocorreu dentro do run. Ausente em jobs antigos. */
  import_db?: ScrapeImportSummary | null;
}

export interface ScrapeJobStatus {
  job_id: string;
  status: 'running' | 'complete' | 'failed';
  started_at: string | null;
  finished_at: string | null;
  report: ScrapeReport | null;
  error: string | null;
}

export interface ScrapeImportResult {
  novos: number;
  atualizados: number;
  total: number;
}
