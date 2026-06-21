import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiKeyService, ApiKeyRequest } from '../../services/api-key.service';

@Component({
  selector: 'app-api-key-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="visible" class="api-key-overlay" (click)="cancel()">
      <div class="api-key-modal" (click)="$event.stopPropagation()">
        <h3 class="api-key-title">Autenticação necessária</h3>
        <p class="api-key-label">{{ currentRequest?.label }}</p>

        <div class="api-key-field">
          <input
            #keyInput
            [type]="showKey ? 'text' : 'password'"
            class="api-key-input"
            placeholder="Digite a API Key"
            [(ngModel)]="keyValue"
            (keyup.enter)="confirm()"
            (keyup.escape)="cancel()"
            autofocus
          />
          <button
            type="button"
            class="api-key-toggle"
            (click)="showKey = !showKey"
            [title]="showKey ? 'Ocultar' : 'Mostrar'"
          >
            {{ showKey ? '🙈' : '👁️' }}
          </button>
        </div>

        <div class="api-key-actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button class="btn btn-primary" (click)="confirm()" [disabled]="!keyValue.trim()">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .api-key-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }

    .api-key-modal {
      width: min(420px, 90vw);
      padding: var(--space-xl);
      background: rgba(1, 19, 28, 0.97);
      border: 1px solid rgba(142, 202, 230, 0.22);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
    }

    .api-key-title {
      margin: 0 0 var(--space-xs);
      font-size: var(--font-size-lg);
    }

    .api-key-label {
      margin: 0 0 var(--space-lg);
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    .api-key-field {
      position: relative;
      display: flex;
      gap: var(--space-sm);
      margin-bottom: var(--space-lg);
    }

    .api-key-input {
      flex: 1;
      min-height: 44px;
      padding: 0 var(--space-md);
      border: 1px solid rgba(142, 202, 230, 0.22);
      border-radius: var(--radius-md);
      font: inherit;
      background: rgba(2, 48, 71, 0.4);
      color: inherit;
    }

    .api-key-input:focus {
      outline: none;
      border-color: var(--brand-teal-500);
      box-shadow: 0 0 0 3px rgba(33, 158, 188, 0.16);
    }

    .api-key-toggle {
      min-height: 44px;
      min-width: 44px;
      border: 1px solid rgba(142, 202, 230, 0.22);
      border-radius: var(--radius-md);
      background: rgba(2, 48, 71, 0.4);
      cursor: pointer;
      font-size: 1rem;
    }

    .api-key-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
    }
  `]
})
export class ApiKeyModalComponent implements OnInit, OnDestroy {
  visible = false;
  keyValue = '';
  showKey = false;
  currentRequest: ApiKeyRequest | null = null;

  private sub!: Subscription;

  constructor(private apiKeyService: ApiKeyService) {}

  ngOnInit() {
    this.sub = this.apiKeyService.request$.subscribe((req) => {
      this.currentRequest = req;
      this.keyValue = '';
      this.showKey = false;
      this.visible = true;
    });
  }

  confirm() {
    if (!this.keyValue.trim()) return;
    this.visible = false;
    this.currentRequest?.resolve(this.keyValue.trim());
    this.currentRequest = null;
  }

  cancel() {
    this.visible = false;
    this.currentRequest?.resolve(null);
    this.currentRequest = null;
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
