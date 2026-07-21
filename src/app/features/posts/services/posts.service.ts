import { Injectable } from "@angular/core";
import { HttpClient, HttpContext, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "../../../../environments/environment";
import { API_KEY_LABEL } from "../../../core/http/api-key.context";

@Injectable({
  providedIn: "root",
})
export class PostsService {
  private apiUrl = environment.postsApiUrl;

  constructor(private http: HttpClient) {}

  private context(label: string): HttpContext {
    return new HttpContext().set(API_KEY_LABEL, label);
  }

  publishPost(data: FormData): Observable<string> {
    return this.http
      .post(this.apiUrl, data, {
        responseType: "text",
        context: this.context("API Key para publicar postagem"),
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = "Erro ao comunicar com o servidor";
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else if (typeof error.error === "string" && error.error.trim()) {
      errorMessage = error.error;
    } else {
      errorMessage = `Erro ${error.status}: ${error.statusText}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
