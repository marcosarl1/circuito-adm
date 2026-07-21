
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {PostPreviewModalComponent} from '../post-preview-modal/post-preview-modal.component';

@Component({
    selector: 'app-post-form-card',
    imports: [FormsModule, PostPreviewModalComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './post-form-card.component.html'
})
export class PostFormCardComponent {
  @Input({ required: true }) formData: any;
  @Input() loading = false;
  @Input() imagePreview = '';
  @Input() selectedImageName = '';
  @Output() publish = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() imageSelected = new EventEmitter<Event>();
  @Output() titleChange = new EventEmitter<string>();

  showPreview = false;
}
