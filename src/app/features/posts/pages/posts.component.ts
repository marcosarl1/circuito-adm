import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostsService } from '../services/posts.service';
import { PostFormCardComponent } from '../components/post-form-card/post-form-card.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PostFormState } from '../../../shared/models/post.model';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';

@Component({
  selector: 'app-posts',
  imports: [PostFormCardComponent, ConfirmModalComponent],
  templateUrl: './posts.component.html',
})
export class PostsComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private postsService = inject(PostsService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  private confirmModal = inject(ConfirmModalService);

  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  private readonly DRAFT_KEY = 'circuito_posts_draft';
  private draftSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private isRestoringDraft = false;
  private draftReady = false;

  loading = this.loadingService.loading;
  imagePreview = signal('');
  selectedImageName = signal('');
  imageError = signal('');
  formData = signal<PostFormState>(this.createEmptyForm());
  hasDraft = signal(false);
  constructor() {
    // autosave com debounce 2s quando formData muda (exceto durante restore ou pristine)
    effect(() => {
      const f = this.formData();
      // observa todos os campos relevantes
      void f.titulo;
      void f.slug;
      void f.descricao;
      void f.conteudoText;
      void f.imagensText;
      void f.autor;
      void f.data;
      if (!this.draftReady) return;
      if (this.isRestoringDraft) return;
      if (this.isFormPristine()) {
        this.clearDraftStorage();
        this.hasDraft.set(false);
        return;
      }
      if (this.draftSaveTimer) clearTimeout(this.draftSaveTimer);
      this.draftSaveTimer = setTimeout(() => this.saveDraft(), 2000);
    });
  }

  ngOnInit(): void {
    this.restoreDraft();
    this.draftReady = true;
  }

  isFormValid = computed(() => {
    const f = this.formData();
    return !!(
      f.imagem &&
      f.slug.trim() &&
      f.titulo.trim() &&
      f.descricao.trim() &&
      f.conteudoText.trim() &&
      f.data.trim() &&
      f.autor.trim()
    );
  });

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      this.clearImage(input);
      return;
    }
    this.handleImageFile(file, input);
  }

  onImageFile(file: File) {
    this.handleImageFile(file);
  }

  clearImage(input?: HTMLInputElement) {
    const prev = this.imagePreview();
    if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    this.imageError.set('');
    this.formData.update((f) => ({ ...f, imagem: null }));
    this.selectedImageName.set('');
    this.imagePreview.set('');
    if (input) input.value = '';
  }

  private handleImageFile(file: File, input?: HTMLInputElement) {
    const prev = this.imagePreview();
    if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.imageError.set('Formato inválido. Use JPG, PNG ou WebP.');
      if (input) input.value = '';
      this.formData.update((f) => ({ ...f, imagem: null }));
      this.selectedImageName.set('');
      this.imagePreview.set('');
      return;
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      this.imageError.set('Imagem muito grande. Máximo 5MB.');
      if (input) input.value = '';
      this.formData.update((f) => ({ ...f, imagem: null }));
      this.selectedImageName.set('');
      this.imagePreview.set('');
      return;
    }

    this.imageError.set('');
    this.formData.update((f) => ({ ...f, imagem: file }));
    this.selectedImageName.set(file.name);
    this.imagePreview.set(URL.createObjectURL(file));
    if (input) input.value = '';
  }

  publishPost() {
    if (!this.validateForm()) {
      const hasImage = !!this.formData().imagem;
      this.toastService.error(
        hasImage
          ? 'Preencha os campos obrigatórios antes de publicar.'
          : 'Selecione a imagem da capa e preencha os campos obrigatórios.',
      );
      return;
    }

    const payload = this.buildFormData();

    this.postsService
      .publishPost(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Postagem publicada com sucesso!');
          this.resetForm();
        },
        error: (error) => {
          this.toastService.error(
            `Erro ao publicar postagem: ${error.message}`,
          );
        },
      });
  }

  async handleResetRequest(): Promise<void> {
    if (this.isFormPristine()) {
      this.resetForm();
      return;
    }
    const confirmed = await this.confirmModal.confirm(
      'Tem certeza que deseja limpar o formulário? Todo o conteúdo preenchido será perdido.',
      {
        title: 'Limpar formulário?',
        confirmText: 'Limpar',
        cancelText: 'Cancelar',
        variant: 'default',
      },
    );
    if (!confirmed) return;
    this.resetForm();
  }

  resetForm() {
    const prev = this.imagePreview();
    if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    this.formData.set(this.createEmptyForm());
    this.imagePreview.set('');
    this.selectedImageName.set('');
    this.imageError.set('');
    this.clearDraftStorage();
    this.hasDraft.set(false);
  }

  discardDraft(): void {
    this.clearDraftStorage();
    this.hasDraft.set(false);
    this.resetForm();
    this.toastService.info('Rascunho descartado');
  }

  private saveDraft(): void {
    const f = this.formData();
    const payload = {
      titulo: f.titulo,
      slug: f.slug,
      descricao: f.descricao,
      conteudoText: f.conteudoText,
      imagensText: f.imagensText,
      autor: f.autor,
      data: f.data,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(this.DRAFT_KEY, JSON.stringify(payload));
      const wasDraft = this.hasDraft();
      this.hasDraft.set(true);
      if (!wasDraft)
        this.toastService.infoWithAction(
          'Rascunho salvo automaticamente',
          'Descartar',
          () => this.discardDraft(),
          5000,
        );
    } catch {}
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(this.DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<PostFormState> & { savedAt?: number };
      const hasContent =
        !!d.titulo?.trim() ||
        !!d.slug?.trim() ||
        !!d.descricao?.trim() ||
        !!d.conteudoText?.trim() ||
        !!d.imagensText?.trim();
      if (!hasContent) return;
      this.isRestoringDraft = true;
      this.formData.update((f) => ({
        ...f,
        titulo: d.titulo ?? f.titulo,
        slug: d.slug ?? f.slug,
        descricao: d.descricao ?? f.descricao,
        conteudoText: d.conteudoText ?? f.conteudoText,
        imagensText: d.imagensText ?? f.imagensText,
        autor: d.autor ?? f.autor,
        data: d.data ?? f.data,
      }));
      this.hasDraft.set(true);
      this.toastService.infoWithAction(
        'Rascunho restaurado, continue de onde parou.',
        'Descartar',
        () => this.discardDraft(),
        5000,
      );
    } catch {} finally {
      this.isRestoringDraft = false;
    }
  }

  private clearDraftStorage(): void {
    try {
      localStorage.removeItem(this.DRAFT_KEY);
    } catch {}
    if (this.draftSaveTimer) {
      clearTimeout(this.draftSaveTimer);
      this.draftSaveTimer = null;
    }
  }

  private isFormPristine(): boolean {
    const f = this.formData();
    const empty = this.createEmptyForm();
    return (
      !f.imagem &&
      f.titulo.trim() === '' &&
      f.slug.trim() === '' &&
      f.descricao.trim() === '' &&
      f.conteudoText.trim() === '' &&
      f.imagensText.trim() === '' &&
      f.autor === empty.autor &&
      f.data === empty.data
    );
  }

  onTitleChange(titulo: string) {
    this.formData.update((f) => ({
      ...f,
      slug: this.generateSlug(titulo),
    }));
  }

  private validateForm(): boolean {
    return this.isFormValid();
  }

  private buildFormData(): FormData {
    const f = this.formData();
    const formData = new FormData();
    const image = f.imagem;
    if (!image) {
      throw new Error('Imagem obrigatória');
    }
    formData.append('imagem', image, image.name);
    formData.append('slug', f.slug);
    formData.append('titulo', f.titulo);
    formData.append('descricao', f.descricao);
    formData.append('data', f.data);
    formData.append('autor', f.autor);
    formData.append(
      'imagens',
      JSON.stringify(this.splitMultilineText(f.imagensText)),
    );
    formData.append(
      'conteudo',
      JSON.stringify(this.splitMultilineText(f.conteudoText)),
    );
    return formData;
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

  ngOnDestroy(): void {
    const prev = this.imagePreview();
    if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    if (this.draftSaveTimer) clearTimeout(this.draftSaveTimer);
  }

  private createEmptyForm(): PostFormState {
    const today = new Date().toISOString().slice(0, 10);
    return {
      imagem: null,
      slug: '',
      titulo: '',
      descricao: '',
      data: today,
      autor: 'Equipe Circuito',
      imagensText: '',
      conteudoText: '',
    };
  }

  private splitMultilineText(value: string): string[] {
    return value
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
}
