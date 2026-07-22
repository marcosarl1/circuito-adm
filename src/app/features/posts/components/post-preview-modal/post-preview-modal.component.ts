import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { PostFormState } from '../../../../shared/models/post.model';

@Component({
  selector: 'app-post-preview-modal',
  imports: [DatePipe],
  templateUrl: './post-preview-modal.component.html',
})
export class PostPreviewModalComponent {
  formData = input.required<PostFormState>();
  imagePreview = input('');
  close = output<void>();

  getParagraphs(): string[] {
    const conteudo = this.formData().conteudoText;
    if (!conteudo) return [];
    return conteudo
      .split('\n')
      .map((p: string) => p.trim())
      .filter(Boolean);
  }
}
