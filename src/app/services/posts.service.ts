import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {EMPTY, Observable, switchMap, throwError} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {ApiKeyService} from './api-key.service';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = environment.postsApiUrl;

  constructor(
    private http: HttpClient,
    private apiKeyService: ApiKeyService
  ) {}

  publishPost(data: FormData): Observable<string> {
    return this.apiKeyService.requestKey('API Key para publicar postagem').pipe(
      switchMap((key) => {
        if (!key) return EMPTY;
        const headers = new HttpHeaders({ 'x-api-key': key });

        return this.http
          .post(this.apiUrl, data, { headers, responseType: 'text' })
          .pipe(catchError(this.handleError));
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Erro ao comunicar com o servidor';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else if (typeof error.error === 'string' && error.error.trim()) {
      errorMessage = error.error;
    } else {
      errorMessage = `Erro ${error.status}: ${error.statusText}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
