import { inject, Service } from '@angular/core';
import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Event, EventCreatePayload } from '../../../shared/models/event.model';
import { API_KEY_LABEL } from '../../../core/http/api-key.context';
import { ApiKeyCancelledError } from '../../../core/http/api-key-cancelled.error';

@Service()
export class EventsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private eventsCache = new Map<string, Observable<Event[]>>();

  private context(label: string): HttpContext {
    return new HttpContext().set(API_KEY_LABEL, label);
  }

  getEvents(page = 1, size = 20, forceRefresh = false): Observable<Event[]> {
    const cacheKey = `${page}:${size}`;
    if (!this.eventsCache.has(cacheKey) || forceRefresh) {
      const params = new HttpParams().set('page', page).set('size', size);

      const requests$ = this.http
        .get<Event[]>(`${this.apiUrl}/api/v1/eventos`, { params })
        .pipe(
          catchError((err) => {
            this.eventsCache.delete(cacheKey);
            return this.handleError(err);
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      this.eventsCache.set(cacheKey, requests$);
    }
    return this.eventsCache.get(cacheKey)!;
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
    this.eventsCache.clear();
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
        errorMessage = `Erro ${error.status}: ${error.status}`;
        console.error('Detalhes do erro:', error.error);
      }
    } else {
      errorMessage = error.message;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
