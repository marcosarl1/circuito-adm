import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, isDevMode } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { EventsService } from '../../events/services/events.service';
import { Event } from '../../../shared/models/event.model';
import { environment } from '../../../../environments/environment';

export interface DashboardStats {
  total: number;
  ativos: number;
  passados: number;
  proximos30d: number;
  proximos90d: number;
  semPreco: number;
  patrocinados: number;
  semImagem: number;
  semLink: number;
  semRegulamento: number;
  valorMedio: number;
  lote1Count: number;
  porMes: { label: string; count: number }[];
  porEstado: { estado: string; count: number }[];
  porCidade: { cidade: string; count: number }[];
  porDistancia: { distancia: string; count: number }[];
  porOrganizador: { organizador: string; count: number }[];
  porFonte: { fonte: string; count: number }[];
  densidade: { data: string; count: number }[];
  choques: number;
  statusInscricoes: { abertas: number; emBreve: number; encerradas: number };
}

const MESES_PT: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function parseDataRealizacao(raw: string, datasISO?: string[] | Date[]): Date | null {
  // Prefer ISO datas_realizacao from backend (datas_realizacao[0]) if available
  if (datasISO && datasISO.length > 0) {
    const iso = datasISO[0];
    const d = new Date(iso as string);
    if (!isNaN(d.getTime())) return d;
  }
  // Fallback strict pt-BR "12 de Junho de 2027" with ISO fallback
  if (!raw) return null;
  // Try ISO first (YYYY-MM-DD)
  const isoTry = new Date(raw);
  if (!isNaN(isoTry.getTime()) && raw.includes('-')) return isoTry;
  try {
    const parts = raw.toLowerCase().trim().split(/\s+/);
    const dia = parseInt(parts[0], 10);
    const mes = MESES_PT[parts[2]];
    const ano = parseInt(parts[4], 10);
    if (!dia || !mes || !ano) return null;
    return new Date(ano, mes - 1, dia);
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private eventsService = inject(EventsService);
  private http = inject(HttpClient);

  private get baseUrl(): string {
    return isDevMode() ? `${environment.apiUrl}api/v1` : '/api/events-proxy';
  }

  getDashboardStats(): Observable<DashboardStats> {
    const url = `${this.baseUrl}/dashboard/stats`;
    const headers = isDevMode() && environment.apiKey ? { headers: new HttpHeaders({ 'x-api-key': environment.apiKey }) } : undefined;
    const opts: { headers?: HttpHeaders } = headers ? { headers: headers.headers } : {};
    // @ts-ignore - HttpClient overload typing for dynamic headers
    return this.http.get<DashboardStats>(url, opts).pipe(
      catchError(() => this.getAllEvents().pipe(map((events) => this.getStats(events)))),
    );
  }

  getAllEvents(): Observable<Event[]> {
    const size = 100;
    return this.eventsService.getEvents('', 1, size).pipe(
      switchMap((first) => {
        if (first.total_pages <= 1) return of(first.eventos);
        const pages = Array.from({ length: first.total_pages - 1 }, (_, i) => i + 2);
        const rest$ = pages.map((p) => this.eventsService.getEvents('', p, size));
        if (rest$.length === 0) return of(first.eventos);
        return forkJoin(rest$).pipe(
          map((pages) => {
            const all = [first.eventos, ...pages.flatMap((pg) => pg.eventos)].flat();
            const byId = new Map<string, Event>();
            for (const e of all) byId.set(e._id, e);
            return [...byId.values()];
          }),
        );
      }),
    );
  }

  getStats(events: Event[]): DashboardStats {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in30 = new Date(now);
    in30.setDate(now.getDate() + 30);
    const in90 = new Date(now);
    in90.setDate(now.getDate() + 90);

    let ativos = 0;
    let passados = 0;
    let proximos30d = 0;
    let proximos90d = 0;
    let semPreco = 0;
    let patrocinados = 0;
    let semImagem = 0;
    let semLink = 0;
    let semRegulamento = 0;
    let lote1Count = 0;
    const precosVals: number[] = [];

    const porMes = new Map<string, number>();
    const porEstado = new Map<string, number>();
    const porCidade = new Map<string, number>();
    const cidadeDisplay = new Map<string, string>();
    const porDistancia = new Map<string, number>();
    const porOrg = new Map<string, number>();
    const orgDisplay = new Map<string, string>();
    const porFonte = new Map<string, number>();
    const fonteDisplay = new Map<string, string>();
    const densidadePorDia = new Map<string, number>();
    let statusAbertas = 0, statusBreve = 0, statusEncerradas = 0;
    const in7 = new Date(now);
    in7.setDate(now.getDate() + 7);

    for (const e of events) {
      const d = parseDataRealizacao(e.data_realizacao, (e as unknown as { datas_realizacao?: string[] }).datas_realizacao);
      if (d) {
        const d0 = new Date(d); d0.setHours(0,0,0,0);
        if (d0 >= now) {
          ativos++;
          if (d0 <= in30) proximos30d++;
          if (d0 <= in90) proximos90d++;
        } else {
          passados++;
        }
        const key = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}`;
        porMes.set(key, (porMes.get(key) ?? 0) + 1);
        densidadePorDia.set(d0.toISOString().slice(0,10), (densidadePorDia.get(d0.toISOString().slice(0,10)) ?? 0) + 1);
        if (d0 < now) statusEncerradas++;
        else if (d0 <= in7) statusBreve++;
        else statusAbertas++;
      } else {
        statusEncerradas++;
      }
      if (!e.precos_entries || e.precos_entries.length === 0) semPreco++;
      else {
        for (const p of e.precos_entries as string[]) {
          if (typeof p === 'string' && p.toLowerCase().includes('lote 1')) { lote1Count++; break; }
        }
        for (const p of e.precos_entries as string[]) {
          const m = String(p).match(/R\$\s*([0-9.,]+)/);
          if (m) { const v = parseFloat(m[1].replace(/\./g, '').replace(',', '.')); if (!isNaN(v)) precosVals.push(v); }
        }
      }
      if (e.patrocinado) patrocinados++;
      if (!e.url_imagem) semImagem++;
      if (!(e as unknown as { url_inscricao?: string }).url_inscricao) semLink++;
      const linkEdital = (e as unknown as { link_edital?: string }).link_edital;
      if (!linkEdital || linkEdital === 'edital não encontrado') semRegulamento++;

      const est = (e.estado || '—').toUpperCase();
      porEstado.set(est, (porEstado.get(est) ?? 0) + 1);

      const cidRaw = (e.cidade || '—').trim();
      const cidKey = cidRaw.toLowerCase();
      if (!cidadeDisplay.has(cidKey)) {
        const normalized = cidRaw.toLowerCase().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        cidadeDisplay.set(cidKey, normalized);
      }
      porCidade.set(cidKey, (porCidade.get(cidKey) ?? 0) + 1);

      for (const dstr of (e.distancias || [])) {
        const raw = String(dstr).trim();
        if (!raw) continue;
        // Extrai todas as distâncias base (5KM, 10KM, 21K...) e soma cada uma
        // Ex: "5KM (CORRIDA)" -> 5KM, "5KM E 10KM (CORRIDA)" -> 5KM + 10KM
        const matches = raw.toUpperCase().match(/\d+(?:[.,]\d+)?\s*K\s*M?/g);
        if (matches && matches.length > 0) {
          for (const m of matches) {
            let norm = m.replace(/\s+/g, '').toUpperCase(); // 5 KM -> 5KM
            if (!norm.endsWith('M') && norm.endsWith('K')) norm += 'M'; // 5K -> 5KM
            // Normaliza 5.0KM -> 5KM, 5,5KM -> 5.5KM
            norm = norm.replace(',', '.');
            porDistancia.set(norm, (porDistancia.get(norm) ?? 0) + 1);
          }
        } else {
          // Fallback: usa string inteira normalizada se não achou padrão
          const norm = raw.toUpperCase().trim();
          porDistancia.set(norm, (porDistancia.get(norm) ?? 0) + 1);
        }
      }

      const orgRaw = (e.organizador || '—').trim();
      const orgKey = orgRaw.toLowerCase();
      if (!orgDisplay.has(orgKey)) orgDisplay.set(orgKey, orgRaw);
      porOrg.set(orgKey, (porOrg.get(orgKey) ?? 0) + 1);

      const fonteRaw = (e.site_coleta || '—').trim();
      const fonteKey = fonteRaw.toLowerCase();
      if (!fonteDisplay.has(fonteKey)) fonteDisplay.set(fonteKey, fonteRaw);
      porFonte.set(fonteKey, (porFonte.get(fonteKey) ?? 0) + 1);
    }

    const valorMedio = precosVals.length ? Math.round((precosVals.reduce((a,b)=>a+b,0)/precosVals.length)*100)/100 : 0;
    const choques = [...densidadePorDia.values()].filter((v) => v > 1).length;
    return {
      total: events.length,
      ativos,
      passados,
      proximos30d,
      proximos90d,
      semPreco,
      patrocinados,
      semImagem,
      semLink,
      semRegulamento,
      valorMedio,
      lote1Count,
      porMes: [...porMes.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([label,count])=>({label,count})),
      porEstado: [...porEstado.entries()].sort((a,b)=>b[1]-a[1]).map(([estado,count])=>({estado,count})),
      porCidade: [...porCidade.entries()].sort((a,b)=>b[1]-a[1]).map(([k,c])=>({cidade: cidadeDisplay.get(k) ?? k, count:c})),
      porDistancia: [...porDistancia.entries()].sort((a,b)=>b[1]-a[1]).map(([k,c])=>({distancia:k,count:c})),
      porOrganizador: [...porOrg.entries()].sort((a,b)=>b[1]-a[1]).map(([k,c])=>({organizador: orgDisplay.get(k) ?? k, count:c})),
      porFonte: [...porFonte.entries()].sort((a,b)=>b[1]-a[1]).map(([k,c])=>({fonte: fonteDisplay.get(k) ?? k, count:c})),
      densidade: [...densidadePorDia.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([data,count])=>({data,count})),
      choques,
      statusInscricoes: { abertas: statusAbertas, emBreve: statusBreve, encerradas: statusEncerradas },
    };
  }
}
