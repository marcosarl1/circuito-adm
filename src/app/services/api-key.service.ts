import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ApiKeyRequest {
  label: string;
  resolve: (key: string | null) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ApiKeyService {
  private requestSubject = new Subject<ApiKeyRequest>();

  request$ = this.requestSubject.asObservable();

  requestKey(label: string): Observable<string | null> {
    return new Observable((observer) => {
      this.requestSubject.next({
        label,
        resolve: (key) => {
          observer.next(key);
          observer.complete();
        }
      });
    });
  }
}
