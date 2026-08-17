import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { EventsService } from '../services/events.service';
import { EventCardComponent } from '../components/event-card/event-card.component';
import { EventFormModalComponent } from '../components/event-form-modal/event-form-modal.component';
import {
  Event,
  EventCreatePayload,
  EventKit,
} from '../../../shared/models/event.model';
import { EventFormState, KitForm } from '../models/event-form-state.model';
import { LoadingService } from '../../../core/services/loading.service';
import { EventCardSkeletonComponent } from '../components/event-card-skeleton/event-card-skeleton.component';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-events',
  imports: [
    FormsModule,
    EventCardComponent,
    EventFormModalComponent,
    EventCardSkeletonComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './events.component.html',
})
export class EventsComponent implements OnInit, OnDestroy {
  private eventsService = inject(EventsService);
  private loadingService = inject(LoadingService);
  private confirmModal = inject(ConfirmModalService);
  private toastService = inject(ToastService);
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  events = signal<Event[]>([]);
  loading = this.loadingService.loading;
  showForm = signal(false);
  editingId = signal<string | null>(null);
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 9;
  totalPages = signal(1);
  totalResults = signal(0);
  formData = signal<EventFormState>(this.createEmptyForm());

  pageEvents = computed(() => this.events());
  filteredEvents = computed(() => this.events());

  visiblePages = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const size = 7;

    if (total <= size) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const showLeftEllipsis = current > 3;
    const showRightEllipsis = current < total - 2;

    let middleCount = size - 2;
    if (showLeftEllipsis) middleCount--;
    if (showRightEllipsis) middleCount--;

    const pages: (number | null)[] = [1];

    if (showLeftEllipsis) {
      pages.push(null);
    }

    let start = Math.max(2, current - Math.floor(middleCount / 2));
    let end = Math.min(total - 1, start + middleCount - 1);

    if (end - start + 1 < middleCount) {
      start = Math.max(2, end - middleCount + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (showRightEllipsis) {
      pages.push(null);
    }

    pages.push(total);
    return pages;
  });

  ngOnInit() {
    this.eventsService.clearCache();
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300))
      .subscribe(() => this.loadEvents());
    this.loadEvents();
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  loadEvents() {
    this.eventsService.getEvents(this.searchTerm(), this.currentPage()).subscribe({
      next: (data) => {
        const list = data.eventos || [];
        this.totalResults.set(data.total ?? 0);
        if (list.length === 0 && this.currentPage() > 1) {
          const lastPage = Math.max(1, data.total_pages);
          this.currentPage.set(lastPage);
          this.loadEvents();
          return;
        }
        this.events.set(list);
        this.totalPages.set(Math.max(1, data.total_pages));
      },
      error: (error) => {
        this.toastService.error('Erro ao carregar eventos: ' + error.message);
      },
    });
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.searchSubject.next(term);
  }

  openCreateForm() {
    this.resetForm();
    this.showForm.set(true);
    this.editingId.set(null);
  }

  syncBucket() {
    this.eventsService.syncBucket().subscribe({
      next: () => {
        this.toastService.success('Sincronização realizada com sucesso!');

        this.loadEvents();
      },
      error: (error) => {
        this.toastService.error(`Erro ao sincronizar: ${error.message}`);
      },
    });
  }

  editEvent(event: Event) {
    this.formData.set(this.mapEventToForm(event));
    this.editingId.set(event._id);
    this.showForm.set(true);
  }

  saveEvent() {
    if (!this.validateForm()) {
      this.toastService.error(
        'Por favor, preencha todos os campos obrigatórios',
      );
      return;
    }

    const payload = this.buildPayload();
    const editingId = this.editingId();

    const action = editingId
      ? this.eventsService.updateEvent(editingId, payload)
      : this.eventsService.createEvent(payload);

    action.subscribe({
      next: () => {
        const msg = editingId ? 'atualizado' : 'criado';
        this.toastService.success(`Evento ${msg} com sucesso!`);
        this.resetForm();
        this.showForm.set(false);
        this.loadEvents();
      },
      error: (error) => {
        this.toastService.error(`Erro ao salvar evento: ${error.message}`);
      },
    });
  }

  async deleteEvent(id: string) {
    const confirmed = await this.confirmModal.confirm(
      'Tem certeza que deseja deletar este evento?',
    );
    if (!confirmed) return;

    this.eventsService.deleteEvent(id).subscribe({
      next: () => {
        this.toastService.success('Evento deletado com sucesso!');
        this.loadEvents();
      },
      error: (error) => {
        this.toastService.error(`Erro ao deletar evento: ${error.message}`);
      },
    });
  }

  cancelEdit() {
    this.resetForm();
    this.showForm.set(false);
  }

  nextPage() {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.update((p) => p + 1);
    this.loadEvents();
  }

  previousPage() {
    if (this.currentPage() <= 1) return;
    this.currentPage.update((p) => p - 1);
    this.loadEvents();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadEvents();
  }

  addKit() {
    this.formData.update((form) => ({
      ...form,
      kits: [...form.kits, this.createEmptyKit()],
    }));
  }

  removeKit(index: number) {
    this.formData.update((form) => {
      if (form.kits.length === 1) {
        return { ...form, kits: [this.createEmptyKit()] };
      }
      return { ...form, kits: form.kits.filter((_, i) => i !== index) };
    });
  }

  getEventId(event: Event): string {
    return event._id;
  }

  getEventTitle(event: Event): string {
    return event.nome_evento || 'Evento sem título';
  }

  getEventDescription(event: Event): string {
    return (
      event.categorias_premiadas ||
      event.percurso?.trajeto ||
      event.site_coleta ||
      'Sem descrição disponível'
    );
  }

  private validateForm(): boolean {
    const f = this.formData();
    return !!(
      f.nome_evento &&
      f.data_realizacao &&
      f.cidade &&
      f.estado &&
      f.organizador &&
      f.url_inscricao
    );
  }

  private resetForm() {
    this.formData.set(this.createEmptyForm());
  }

  private createEmptyKit(): KitForm {
    return {
      nome: '',
      itensText: '',
      local_retirada: '',
      data_retirada: '',
    };
  }

  private createEmptyForm(): EventFormState {
    return {
      nome_evento: '',
      data_realizacao: '',
      cidade: '',
      estado: '',
      organizador: '',
      site_coleta: '',
      data_coleta: new Date().toISOString(),
      distanciasText: '',
      horario: '',
      url_inscricao: '',
      url_imagem: '',
      categoriasText: '',
      link_edital: '',
      categorias_premiadas: '',
      preco: '',
      precosEntriesText: '',
      patrocinado: false,
      percurso: {
        local_largada: '',
        trajeto: '',
      },
      kits: [this.createEmptyKit()],
      camposProtegidosText: '',
      listaPrecosText: '',
    };
  }

  private mapEventToForm(event: Event): EventFormState {
    const kits = event.kits?.length ? event.kits : [];

    return {
      nome_evento: event.nome_evento,
      data_realizacao: event.data_realizacao,
      cidade: event.cidade,
      estado: event.estado,
      organizador: event.organizador || 'Não encontrado',
      site_coleta: event.site_coleta,
      data_coleta: event.data_coleta || new Date().toISOString(),
      distanciasText: this.toMultilineText(event.distancias),
      horario: event.horario,
      url_inscricao: event.url_inscricao,
      url_imagem: event.url_imagem,
      categoriasText: this.toMultilineText(event.categorias),
      link_edital: event.link_edital,
      categorias_premiadas: event.categorias_premiadas,
      preco: event.preco,
      precosEntriesText: this.toMultilineText(event.precos_entries),
      patrocinado: Boolean(event.patrocinado),
      percurso: {
        local_largada: event.percurso?.local_largada || '',
        trajeto: event.percurso?.trajeto || '',
      },
      kits: kits.length
        ? kits.map((kit: EventKit) => ({
            nome: kit.nome,
            itensText: this.toMultilineText(kit.itens),
            local_retirada: kit.local_retirada ?? '',
            data_retirada: kit.data_retirada ?? '',
          }))
        : [this.createEmptyKit()],
      camposProtegidosText: this.toMultilineText(event.campos_protegidos),
      listaPrecosText: this.toMultilineText(event.lista_precos),
    };
  }

  private buildPayload(): EventCreatePayload {
    const f = this.formData();
    const payload: EventCreatePayload = {
      nome_evento: f.nome_evento,
      data_realizacao: f.data_realizacao,
      cidade: f.cidade,
      estado: f.estado,
      organizador: f.organizador,
      site_coleta: f.site_coleta,
      data_coleta: f.data_coleta,
      distancias: this.splitMultilineText(f.distanciasText),
      url_inscricao: f.url_inscricao,
      url_imagem: f.url_imagem,
      categorias: this.splitMultilineText(f.categoriasText),
      link_edital: f.link_edital,
      categorias_premiadas: f.categorias_premiadas,
      preco: f.preco,
      precos_entries: this.splitMultilineText(f.precosEntriesText),
      patrocinado: f.patrocinado,
      percurso: {
        local_largada: f.percurso.local_largada,
        trajeto: f.percurso.trajeto,
      },
      kits: f.kits.map((kit) => ({
        nome: kit.nome,
        itens: this.splitMultilineText(kit.itensText),
        local_retirada: kit.local_retirada,
        data_retirada: this.isValidDate(kit.data_retirada)
          ? kit.data_retirada
          : new Date().toISOString(),
      })),
      campos_protegidos: this.splitMultilineText(f.camposProtegidosText),
      lista_precos: this.splitMultilineText(f.listaPrecosText),
    };
    if (f.horario?.match(/^\d{2}:\d{2}$/)) {
      payload.horario = f.horario;
    }

    return payload;
  }

  private isValidDate(value: string): boolean {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private toMultilineText(value: string[] | undefined): string {
    return value?.filter(Boolean).join('\n') ?? '';
  }

  private splitMultilineText(value: string): string[] {
    return value
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
}
