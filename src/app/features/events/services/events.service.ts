import { inject, Service, signal } from '@angular/core';
import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Event, EventCreatePayload } from '../../../shared/models/event.model';
import { API_KEY_LABEL } from '../../../core/http/api-key.context';
import { ApiKeyCancelledError } from '../../../core/http/api-key-cancelled.error';

@Service()
export class EventsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private allEventsCache = signal<Event[] | null>(null);

  private context(label: string): HttpContext {
    return new HttpContext().set(API_KEY_LABEL, label);
  }

  getAllEvents(forceRefresh = false): Observable<Event[]> {
    if (!forceRefresh) {
      const cached = this.allEventsCache();
      if (cached) return of(cached);
    }
    const pageSize = 100;
    const all: Event[] = [];

    const load = (page: number): Observable<Event[]> =>
      this.fetchPage(page, pageSize).pipe(
        concatMap((events) => {
          all.push(...events);
          return events.length >= pageSize ? load(page + 1) : of(all);
        }),
      );

    return load(1).pipe(tap((events) => this.allEventsCache.set(events)));
  }

  private fetchPage(page: number, size: number): Observable<Event[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Event[]>(`${this.apiUrl}/api/v1/eventos`, { params });
  }

  createEvent(data: EventCreatePayload): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/api/v1/eventos`, data, {
        context: this.context('API Key para criar evento'),
      })
      .pipe(
        tap(() => this.clearEventsCache()),
        catchError(this.handleError),
      );
  }

  updateEvent(evento_id: string, data: EventCreatePayload): Observable<any> {
    const payload = { evento_id, ...data };
    return this.http
      .patch(`${this.apiUrl}/api/v1/eventos/${evento_id}`, payload, {
        context: this.context('API Key para atualizar evento'),
      })
      .pipe(
        tap(() => this.clearEventsCache()),
        catchError(this.handleError),
      );
  }

  deleteEvent(id: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/api/v1/eventos/${id}`, {
        context: this.context('API Key para deletar evento'),
      })
      .pipe(
        tap(() => this.clearEventsCache()),
        catchError(this.handleError),
      );
  }

  syncBucket(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/api/v1/sync-bucket`, null, {
        context: this.context('API Key para sincronizar bucket'),
      })
      .pipe(
        tap(() => this.clearEventsCache()),
        catchError(this.handleError),
      );
  }

  private clearEventsCache() {
    this.allEventsCache.set(null);
  }

  private handleError(error: HttpErrorResponse | Error) {
    if (error instanceof ApiKeyCancelledError) {
      return throwError(() => error);
    }

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
