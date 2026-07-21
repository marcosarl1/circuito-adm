import { CommonModule} from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectorRef, OnInit } from '@angular/core';

@Component({
    selector: 'app-post-preview-modal',
    imports: [CommonModule],
    templateUrl: './post-preview-modal.component.html'
})
export class PostPreviewModalComponent implements OnInit {
  @Input({ required: true }) formData: any;
  @Input() imagePreview = '';
  @Output() close = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cdr.detectChanges();
  }

  getParagraphs(): string[] {
    if (!this.formData?.conteudoText) return [];
    return this.formData.conteudoText
      .split('\n')
      .map((p: string) => p.trim())
      .filter(Boolean);
  }
}
