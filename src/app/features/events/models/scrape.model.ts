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

export interface ScrapeReport {
  started_at: string | null;
  finished_at: string | null;
  scrapers: ScrapeScraperResult[];
  csvs: ScrapeCsvSummary[];
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
