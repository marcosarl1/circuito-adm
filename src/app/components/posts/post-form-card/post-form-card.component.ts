import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-form-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-form-card.component.html',
  styleUrl: './post-form-card.component.css'
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
}
