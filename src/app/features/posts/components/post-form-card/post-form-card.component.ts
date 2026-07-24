import { Component, model, output, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostPreviewModalComponent } from '../post-preview-modal/post-preview-modal.component';
import { PostFormState } from '../../../../shared/models/post.model';

@Component({
  selector: 'app-post-form-card',
  imports: [FormsModule, PostPreviewModalComponent],
  templateUrl: './post-form-card.component.html',
})
export class PostFormCardComponent {
  formData = model.required<PostFormState>();
  loading = input(false);
  imagePreview = input('');
  selectedImageName = input('');

  publish = output<void>();
  reset = output<void>();
  imageSelected = output<Event>();
  titleChange = output<string>();

  showPreview = signal(false);

  updateField<K extends keyof PostFormState>(key: K, value: PostFormState[K]) {
    this.formData.update((f) => ({ ...f, [key]: value }));
  }

  onTitleChange(value: string) {
    this.updateField('titulo', value);
    this.titleChange.emit(value);
  }
}
