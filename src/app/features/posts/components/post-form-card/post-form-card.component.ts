import { Component, computed, effect, inject, model, output, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostPreviewModalComponent } from '../post-preview-modal/post-preview-modal.component';
import { PostFormState } from '../../../../shared/models/post.model';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-post-form-card',
  imports: [FormsModule, PostPreviewModalComponent],
  templateUrl: './post-form-card.component.html',
})
export class PostFormCardComponent {
  private loadingService = inject(LoadingService);

  formData = model.required<PostFormState>();
  loading = this.loadingService.loading;
  imagePreview = input('');
  selectedImageName = input('');

  publish = output<void>();
  reset = output<void>();
  imageSelected = output<Event>();
  titleChange = output<string>();

  showPreview = signal(false);
  submitted = signal(false);

  constructor() {
    // auto-clear validation after parent resets form to empty (publish success or Limpar)
    effect(() => {
      const f = this.formData();
      const isEmpty = !f.titulo && !f.slug && !f.descricao && !f.conteudoText;
      if (isEmpty && this.submitted()) {
        this.submitted.set(false);
      }
    });
  }

  tituloError = computed(() =>
    !this.formData().titulo.trim() && this.submitted() ? 'Título é obrigatório' : '',
  );
  slugError = computed(() =>
    !this.formData().slug.trim() && this.submitted() ? 'Slug é obrigatório' : '',
  );
  descricaoError = computed(() =>
    !this.formData().descricao.trim() && this.submitted() ? 'Descrição é obrigatória' : '',
  );
  conteudoError = computed(() =>
    !this.formData().conteudoText.trim() && this.submitted() ? 'Conteúdo é obrigatório' : '',
  );
  dataError = computed(() =>
    !this.formData().data.trim() && this.submitted() ? 'Data é obrigatória' : '',
  );
  autorError = computed(() =>
    !this.formData().autor.trim() && this.submitted() ? 'Autor é obrigatório' : '',
  );

  updateField<K extends keyof PostFormState>(key: K, value: PostFormState[K]) {
    this.formData.update((f) => ({ ...f, [key]: value }));
  }

  onTitleChange(value: string) {
    this.updateField('titulo', value);
    this.titleChange.emit(value);
  }

  handlePublish(): void {
    this.submitted.set(true);
    this.publish.emit();
  }

  handleReset(): void {
    this.submitted.set(false);
    this.reset.emit();
  }
}
