import { inject, Service, signal } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { Event, EventCreatePayload } from '../../../shared/models/event.model';

@Service()
export class EventsService {
  private http = inject(HttpClient);
  private apiUrl = 'apiUrl';
  private allEventsCache = signal<Event[] | null>(null);

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
    return this.http.post(`${this.apiUrl}/api/v1/eventos`, data).pipe(
      tap(() => this.clearEventsCache()),
      catchError(this.handleError),
    );
  }

  updateEvent(evento_id: string, data: EventCreatePayload): Observable<any> {
    const payload = { evento_id, ...data };
    return this.http
      .patch(`${this.apiUrl}/api/v1/eventos/${evento_id}`, payload)
      .pipe(
        tap(() => this.clearEventsCache()),
        catchError(this.handleError),
      );
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/v1/eventos/${id}`).pipe(
      tap(() => this.clearEventsCache()),
      catchError(this.handleError),
    );
  }

  syncBucket(): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/v1/sync-bucket`, null).pipe(
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
