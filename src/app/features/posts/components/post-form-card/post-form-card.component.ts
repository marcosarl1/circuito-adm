import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  model,
  output,
  input,
  signal,
  viewChild,
} from '@angular/core';
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
  imageError = input('');

  isFormValid = input(false);

  publish = output<void>();
  reset = output<void>();
  imageSelected = output<Event>();
  titleChange = output<string>();
  previewOpened = output<void>();

  showPreview = signal(false);
  submitted = signal(false);

  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  constructor() {
    // auto-clear validation after parent resets form to empty (publish success or Limpar)
    effect(() => {
      const f = this.formData();
      const isEmpty = !f.titulo && !f.slug && !f.descricao && !f.conteudoText;
      if (isEmpty && this.submitted()) {
        this.submitted.set(false);
      }
    });

    // clear native file input when imagem becomes null (reset/publish success/validation fail)
    effect(() => {
      if (!this.formData().imagem) {
        const el = this.fileInput()?.nativeElement;
        if (el) el.value = '';
      }
    });

    // fecha o preview e limpa submitted quando o formulário é resetado (Limpar ou publish sucesso)
    effect(() => {
      const f = this.formData();
      const isPristine =
        !f.imagem &&
        !f.titulo.trim() &&
        !f.slug.trim() &&
        !f.descricao.trim() &&
        !f.conteudoText.trim() &&
        !f.imagensText.trim();
      if (isPristine && this.showPreview()) {
        this.showPreview.set(false);
      }
    });
  }

  imagemError = computed(() =>
    !this.formData().imagem && this.submitted() ? 'Imagem da capa é obrigatória' : '',
  );
  imageDisplayError = computed(() => this.imageError() || this.imagemError());
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

  openPreview(): void {
    // marca submitted para exibir erros inline caso tente pré-visualizar inválido
    if (!this.isFormValid()) this.submitted.set(true);
    this.showPreview.set(true);
  }

  handleModalPublish(): void {
    this.submitted.set(true);
    this.publish.emit();
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
