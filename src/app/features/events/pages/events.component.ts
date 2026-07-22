import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventsService } from '../services/events.service';
import { EventCardComponent } from '../components/event-card/event-card.component';
import { EventFormModalComponent } from '../components/event-form-modal/event-form-modal.component';
import {
  Event,
  EventCreatePayload,
  EventKit,
} from '../../../shared/models/event.model';
import { finalize } from 'rxjs';
import { ApiKeyCancelledError } from '../../../core/http/api-key-cancelled.error';
import { EventFormState, KitForm } from '../models/event-form-state.model';

@Component({
  selector: 'app-events',
  imports: [FormsModule, EventCardComponent, EventFormModalComponent],
  templateUrl: './events.component.html',
})
export class EventsComponent implements OnInit {
  private eventsService = inject(EventsService);

  events = signal<Event[]>([]);
  loading = signal(false);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  searchTerm = signal('');
  successMessage = signal('');
  errorMessage = signal('');
  currentPage = signal(1);
  pageSize = 9;
  hasNextPage = signal(true);
  formData = signal<EventFormState>(this.createEmptyForm());

  filteredEvents = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const events = this.events();
    if (!term) return events;

    return events.filter(
      (event) =>
        event.nome_evento.toLowerCase().includes(term) ||
        event.categorias_premiadas.toLowerCase().includes(term) ||
        event.cidade.toLowerCase().includes(term) ||
        event.estado.toLowerCase().includes(term) ||
        event.organizador.toLowerCase().includes(term),
    );
  });

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    this.eventsService
      .getEvents(this.currentPage(), this.pageSize)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          const list = data || [];
          this.events.set(list);
          this.hasNextPage.set(list.length === this.pageSize);
        },
        error: (error) => {
          this.errorMessage.set('Erro ao carregar eventos: ' + error.message);
          setTimeout(() => this.errorMessage.set(''), 5000);
        },
      });
  }

  openCreateForm() {
    this.resetForm();
    this.showForm.set(true);
    this.editingId.set(null);
  }

  syncBucket() {
    this.loading.set(true);
    this.eventsService
      .syncBucket()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Sincronização realizada com sucesso!');
          setTimeout(() => this.successMessage.set(''), 5000);
          this.loading.set(false);
          this.loadEvents();
        },
        error: (error) => {
          if (error instanceof ApiKeyCancelledError) return;
          this.errorMessage.set(`Erro ao sincronizar: ${error.message}`);
          setTimeout(() => this.errorMessage.set(''), 5000);
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
      this.errorMessage.set('Por favor, preencha todos os campos obrigatórios');
      setTimeout(() => this.errorMessage.set(''), 5000);
      return;
    }

    this.loading.set(true);
    const payload = this.buildPayload();
    const editingId = this.editingId();

    const action = editingId
      ? this.eventsService.updateEvent(editingId, payload)
      : this.eventsService.createEvent(payload);

    action.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        const msg = editingId ? 'atualizado' : 'criado';
        this.successMessage.set(`Evento ${msg} com sucesso!`);
        setTimeout(() => this.successMessage.set(''), 5000);
        this.resetForm();
        this.showForm.set(false);
        this.loadEvents();
      },
      error: (error) => {
        if (error instanceof ApiKeyCancelledError) return;
        this.errorMessage.set(`Erro ao salvar evento: ${error.message}`);
        this.loading.set(false);
        setTimeout(() => this.errorMessage.set(''), 5000);
      },
    });
  }

  deleteEvent(id: string) {
    if (!confirm('Tem certeza que deseja deletar este evento?')) {
      return;
    }

    this.loading.set(true);
    this.eventsService
      .deleteEvent(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Evento deletado com sucesso!');
          setTimeout(() => this.successMessage.set(''), 5000);
          this.loadEvents();
        },
        error: (error) => {
          if (error instanceof ApiKeyCancelledError) return;
          this.errorMessage.set(`Erro ao deletar evento: ${error.message}`);
          this.loading.set(false);
          setTimeout(() => this.errorMessage.set(''), 5000);
        },
      });
  }

  cancelEdit() {
    this.resetForm();
    this.showForm.set(false);
  }

  nextPage() {
    if (!this.hasNextPage()) return;
    this.currentPage.update((p) => p + 1);
    this.loadEvents();
  }

  previousPage() {
    if (this.currentPage() <= 1) return;
    this.currentPage.update((p) => p - 1);
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

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      draft: 'Rascunho',
    };

    return labels[status || 'active'] || 'Ativo';
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
