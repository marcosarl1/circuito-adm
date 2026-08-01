import { inject, isDevMode, Service } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Service()
export class PostsService {
  private http = inject(HttpClient);

  publishPost(data: FormData): Observable<string> {
    const headers =
      isDevMode() && environment.postsApiKey
        ? new HttpHeaders({ 'x-api-key': environment.postsApiKey })
        : undefined;
    return this.http
      .post(isDevMode() ? environment.postsApiUrl : '/api/posts-proxy', data, {
        responseType: 'text',
        headers,
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Erro ao comunicar com o servidor';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else if (typeof error.error === 'string' && error.error.trim()) {
      errorMessage = error.error;
    } else {
      errorMessage = `Erro ${error.status}: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
