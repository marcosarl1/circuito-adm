import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { ApiKeyService, ApiKeyRequest } from "../../../core/services/api-key.service";

@Component({
    selector: "app-api-key-modal",
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: "./api-key-modal.component.html"
})
export class ApiKeyModalComponent implements OnInit, OnDestroy {
  visible = false;
  keyValue = "";
  showKey = false;
  currentRequest: ApiKeyRequest | null = null;
  private sub!: Subscription;

  constructor(private apiKeyService: ApiKeyService) {}

  ngOnInit() {
    this.sub = this.apiKeyService.request$.subscribe((req) => {
      this.currentRequest = req;
      this.keyValue = "";
      this.showKey = false;
      this.visible = true;
    });
  }

  confirm() {
    if (!this.keyValue.trim()) return;
    this.closeWith(this.keyValue.trim());
  }

  cancel() {
    this.closeWith(null);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.currentRequest) {
      this.closeWith(null);
    }
  }

  private closeWith(key: string | null) {
    this.visible = false;
    this.currentRequest?.resolve(key);
    this.currentRequest = null;
  }
}
