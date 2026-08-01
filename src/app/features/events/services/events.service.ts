import { inject, isDevMode, Service, signal } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { Event, EventCreatePayload } from '../../../shared/models/event.model';
import { environment } from '../../../../environments/environment';

@Service()
export class EventsService {
  private http = inject(HttpClient);
  private allEventsCache = signal<Event[] | null>(null);

  private get baseUrl(): string {
    return isDevMode() ? `${environment.apiUrl}/api/v1` : '/api/events-proxy';
  }

  private get apiHeaders() {
    return isDevMode() && environment.apiKey
      ? { headers: new HttpHeaders({ 'x-api-key': environment.apiKey }) }
      : {};
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
    return this.http.get<Event[]>(`${this.baseUrl}/eventos`, { params });
  }

  createEvent(data: EventCreatePayload): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/eventos`, data, { ...this.apiHeaders })
      .pipe(
        tap(() => this.clearEventsCache()),
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
        tap(() => this.clearEventsCache()),
        catchError(this.handleError),
      );
  }

  deleteEvent(id: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/eventos/${id}`, { ...this.apiHeaders })
      .pipe(
        tap(() => this.clearEventsCache()),
        catchError(this.handleError),
      );
  }

  syncBucket(): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/sync-bucket`, null, { ...this.apiHeaders })
      .pipe(
        tap(() => this.clearEventsCache()),
        catchError(this.handleError),
      );
  }

  private clearEventsCache() {
    this.allEventsCache.set(null);
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
