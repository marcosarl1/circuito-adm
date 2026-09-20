import { Service, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '../contexts/skip-loading.context';

@Service()
export class WarmupService {
  private http = inject(HttpClient);
  private warmed = false;

  warm(): void {
    if (this.warmed) return;
    this.warmed = true;

    if (isDevMode()) return;


    this.whenIdle(() => {
      const ctx = new HttpContext().set(SKIP_LOADING, true);
      this.http
        .get('/api/warmup', { context: ctx })
        .subscribe({ error: () => { } });
    });
  }

  private whenIdle(cb: () => void): void {
    const ric = (
      globalThis as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    if (typeof ric === 'function') ric.call(globalThis, cb, { timeout: 2000 });
    else setTimeout(cb, 800);
  }
}
