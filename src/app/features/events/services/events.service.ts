import { inject, isDevMode, Service } from '@angular/core';
import {
  HttpContext,
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  EventCreatePayload,
  EventPage,
} from '../../../shared/models/event.model';
import { SKIP_LOADING } from '../../../core/contexts/skip-loading.context';
import { ScrapeImportResult, ScrapeJobStatus } from '../models/scrape.model';
import { environment } from '../../../../environments/environment';

@Service()
export class EventsService {
  private http = inject(HttpClient);
  private pageSize = 9;
  private eventsCache = new Map<string, EventPage>();

  private get baseUrl(): string {
    return isDevMode() ? `${environment.apiUrl}api/v1` : '/api/events-proxy';
  }

  private get apiHeaders() {
    return isDevMode() && environment.apiKey
      ? { headers: new HttpHeaders({ 'x-api-key': environment.apiKey }) }
      : {};
  }

  private get scrapeHeaders() {
    return isDevMode() && environment.scrapersApiKey
      ? { headers: new HttpHeaders({ 'x-api-key': environment.scrapersApiKey }) }
      : {};
  }

  getEvents(search = '', page = 1): Observable<EventPage> {
    const query = search?.trim() || '';

    const key = query ? `q:${query}:${page}` : `p:${page}`;
    const cached = this.eventsCache.get(key);
    if (cached) return of(cached);

    let params = new HttpParams().set('page', page).set('size', this.pageSize);
    if (query) {
      params = params.set('q', query);
    }

    return this.http
      .get<EventPage>(`${this.baseUrl}/eventos`, { params })
      .pipe(tap((data) => this.eventsCache.set(key, data)));
  }

  runScrape(): Observable<{ job_id: string }> {
    return this.http.post<{ job_id: string }>(
      `${this.baseUrl}/scrape/run`,
      null,
      { ...this.scrapeHeaders },
    );
  }

  getScrapeStatus(jobId: string): Observable<ScrapeJobStatus> {
    return this.http.get<ScrapeJobStatus>(
      `${this.baseUrl}/scrape/status/${jobId}`,
      {
        ...this.scrapeHeaders,
        context: new HttpContext().set(SKIP_LOADING, true),
      },
    );
  }

  importScrapedEvents(): Observable<ScrapeImportResult> {
    return this.http.post<ScrapeImportResult>(
      `${this.baseUrl}/scrape/import`,
      null,
      { ...this.scrapeHeaders },
    );
  }

  createEvent(data: EventCreatePayload): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/eventos`, data, { ...this.apiHeaders })
      .pipe(
        tap(() => this.clearCache()),
        catchError(this.handleError),
      );
  }

  updateEvent(evento_id: string, data: EventCreatePayload): Observable<any> {
    const payload = { evento_id, ...data };
    return this.http
      .patch(`${this.baseUrl}/eventos/${evento_id}`, payload, {
        ...this.apiHeaders,
      })
      .pipe(
        tap(() => this.clearCache()),
        catchError(this.handleError),
      );
  }

  deleteEvent(id: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/eventos/${id}`, { ...this.apiHeaders })
      .pipe(
        tap(() => this.clearCache()),
        catchError(this.handleError),
      );
  }

  syncBucket(): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/sync-bucket`, null, { ...this.apiHeaders })
      .pipe(
        tap(() => this.clearCache()),
        catchError(this.handleError),
      );
  }

  clearCache() {
    this.eventsCache.clear();
  }

  private handleError(error: HttpErrorResponse | Error) {
    let errorMessage = 'Erro ao comunicar com o servidor';
    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Erro: ${error.error.message}`;
      } else {
        errorMessage = `Erro ${error.status}: ${error.message}`;
        console.error('Detalhes do erro:', error.error);
      }
    } else {
      errorMessage = error.message;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
