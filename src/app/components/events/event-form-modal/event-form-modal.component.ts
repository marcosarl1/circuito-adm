import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-form-modal.component.html',
  styleUrl: './event-form-modal.component.css'
})
export class EventFormModalComponent {
  @Input({ required: true }) formData: any;
  @Input() loading = false;
  @Input() editingId: string | null = null;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() addKit = new EventEmitter<void>();
  @Output() removeKit = new EventEmitter<number>();

  trackByIndex(index: number) {
    return index;
  }
}
