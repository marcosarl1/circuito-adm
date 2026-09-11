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
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PostFormState } from '../../../../shared/models/post.model';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-post-form-card',
  imports: [FormsModule, PostPreviewModalComponent, IconComponent],
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
  imageFileSelected = output<File>();
  clearImage = output<void>();
  titleChange = output<string>();

  showPreview = signal(false);
  submitted = signal(false);
  slugLocked = signal(true);
  slugCopied = signal(false);
  isDragging = signal(false);

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
  slugFormatValid = computed(() => {
    const s = this.formData().slug.trim();
    if (!s) return true; // vazio tratado por slugError
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
  });
  slugError = computed(() => {
    const s = this.formData().slug.trim();
    if (!s && this.submitted()) return 'Slug é obrigatório';
    if (s && !this.slugFormatValid() && this.submitted())
      return 'Use apenas letras minúsculas, números e hifens (ex: meu-post)';
    if (s && !this.slugFormatValid()) return 'Formato inválido';
    return '';
  });
  slugPreviewUrl = computed(() => {
    const slug = this.formData().slug.trim() || 'seu-slug';
    return `circuitoapp.com.br/blog/${slug}`;
  });
  imageFileSizeLabel = computed(() => {
    const f = this.formData().imagem;
    if (!f) return '';
    const kb = f.size / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
  });
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
    if (this.slugLocked()) this.titleChange.emit(value);
  }

  onSlugChange(value: string) {
    this.slugLocked.set(false);
    this.updateField('slug', value);
  }

  toggleSlugLock(): void {
    const next = !this.slugLocked();
    this.slugLocked.set(next);
    if (next) {
      const gen = this.generateSlug(this.formData().titulo);
      if (gen) this.formData.update((f) => ({ ...f, slug: gen }));
    }
  }

  async copySlugUrl(): Promise<void> {
    const url = `https://${this.slugPreviewUrl()}`;
    try {
      await navigator.clipboard.writeText(url);
      this.slugCopied.set(true);
      setTimeout(() => this.slugCopied.set(false), 1800);
    } catch {
      // fallback: seleciona texto via execCommand não necessário
    }
  }

  private generateSlug(titulo: string): string {
    return titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.loading()) return;
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (this.loading()) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.imageFileSelected.emit(file);
  }

  onRemoveImage(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.clearImage.emit();
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
