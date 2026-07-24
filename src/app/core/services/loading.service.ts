import { computed, Service, signal } from '@angular/core';

@Service()
export class LoadingService {
  private activeRequests = signal(0);

  loading = computed(() => this.activeRequests() > 0);

  show() {
    this.activeRequests.update((v) => v + 1);
  }

  hide() {
    this.activeRequests.update((v) => Math.max(v - 1, 0));
  }
}
