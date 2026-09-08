import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { EventsService } from '../../events/services/events.service';
import { Event } from '../../../shared/models/event.model';

export interface DashboardStats {
  total: number;
  ativos: number;
  passados: number;
  proximos30d: number;
  proximos90d: number;
  semPreco: number;
  patrocinados: number;
  semImagem: number;
  porMes: { label: string; count: number }[];
  porEstado: { estado: string; count: number }[];
  porOrganizador: { organizador: string; count: number }[];
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

function parseDataRealizacao(raw: string): Date | null {
  try {
    const parts = raw.toLowerCase().split(' ');
    // "12 de Junho de 2027"
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

  getAllEvents(): Observable<Event[]> {
    // 242 / 100 = 3 páginas
    return this.eventsService.getEvents('', 1).pipe(
      switchMap((first) => {
        if (first.total_pages <= 1) return of(first.eventos);
        const pages = Array.from({ length: first.total_pages - 1 }, (_, i) => i + 2);
        const rest$ = pages.map((p) => this.eventsService.getEvents('', p));
        if (rest$.length === 0) return of(first.eventos);
        return forkJoin(rest$).pipe(map((pages) => [first.eventos, ...pages.flatMap((pg) => pg.eventos)].flat()));
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

    const porMes = new Map<string, number>();
    const porEstado = new Map<string, number>();
    const porOrg = new Map<string, number>();

    for (const e of events) {
      const d = parseDataRealizacao(e.data_realizacao);
      if (d) {
        if (d >= now) {
          ativos++;
          if (d <= in30) proximos30d++;
          if (d <= in90) proximos90d++;
        } else {
          passados++;
        }
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        porMes.set(key, (porMes.get(key) ?? 0) + 1);
      }
      if (!e.precos_entries || e.precos_entries.length === 0) semPreco++;
      if (e.patrocinado) patrocinados++;
      if (!e.url_imagem) semImagem++;

      const est = (e.estado || '—').toUpperCase();
      porEstado.set(est, (porEstado.get(est) ?? 0) + 1);

      const org = (e.organizador || '—').trim();
      porOrg.set(org, (porOrg.get(org) ?? 0) + 1);
    }

    return {
      total: events.length,
      ativos,
      passados,
      proximos30d,
      proximos90d,
      semPreco,
      patrocinados,
      semImagem,
      porMes: [...porMes.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, count]) => ({ label, count })),
      porEstado: [...porEstado.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([estado, count]) => ({ estado, count })),
      porOrganizador: [...porOrg.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([organizador, count]) => ({ organizador, count })),
    };
  }
}
