import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {EMPTY, Observable, switchMap, throwError} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {ApiKeyService} from './api-key.service';
import {EventCreatePayload} from '../shared/models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private apiKeyService: ApiKeyService
  ) {}

  private withHeaders(label: string): Observable<HttpHeaders> {
    return this.apiKeyService.requestKey(label).pipe(switchMap((key) => {
      if (!key) return EMPTY;
      return [
        new HttpHeaders({
          'Content-Type': 'application/json',
          'x-api-key': key
        })
      ];
    })
    );
  }

  getEvents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/v1/eventos`)
      .pipe(catchError(this.handleError));
  }

  createEvent(data: EventCreatePayload): Observable<any> {
    return this.withHeaders('API Key para criar evento').pipe(switchMap((headers) =>
    this.http.post(`${this.apiUrl}/api/v1/eventos`, data, { headers }).pipe(catchError(this.handleError))))
  }

  updateEvent(evento_id: string, data: EventCreatePayload): Observable<any> {
    const payload = { evento_id, ...data };
    return this.withHeaders('API Key para atualizar evento').pipe(
      switchMap((headers) =>
        this.http
          .patch(`${this.apiUrl}/api/v1/eventos/${evento_id}`, payload, { headers })
          .pipe(catchError(this.handleError))
      )
    );
  }

  deleteEvent(id: string): Observable<any> {
    return this.withHeaders('API Key para deletar evento').pipe(
      switchMap((headers) =>
        this.http.delete(`${this.apiUrl}/api/v1/eventos/${id}`, { headers }).pipe(catchError(this.handleError))
      )
    );
  }

  syncBucket(): Observable<any> {
    return this.withHeaders('API Key para sincronizar bucket').pipe(
      switchMap((headers) =>
        this.http
          .post(`${this.apiUrl}/api/v1/sync-bucket`, null, { headers })
          .pipe(catchError(this.handleError))
      )
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Erro ao comunicar com o servidor';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      errorMessage = `Erro ${error.status}: ${error.statusText}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
