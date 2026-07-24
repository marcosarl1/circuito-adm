import { inject, Service } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiKeyService } from '../../../core/services/api-key.service';

@Service()
export class PostsService {
  private http = inject(HttpClient);
  private apiKeyService = inject(ApiKeyService);
  private apiUrl = environment.postsApiUrl;

  publishPost(data: FormData): Observable<string> {
    return this.apiKeyService.requestKey('API Key para publicar postagem').pipe(
      switchMap((key) => {
        if (!key) return EMPTY;
        const headers = new HttpHeaders({ 'x-api-key': key });
        return this.http
          .post(this.apiUrl, data, {
            headers,
            responseType: 'text',
          })
          .pipe(catchError((err) => this.handleError(err)));
      }),
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Erro ao comunicar com o servidor';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else if (typeof error.error === 'string' && error.error.trim()) {
      errorMessage = error.error;
    } else {
      errorMessage = `Erro ${error.status}: ${error.status}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
