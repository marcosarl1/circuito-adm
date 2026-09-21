import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { map, of, throwError, timer } from 'rxjs';
import { EventsComponent } from './events.component';
import { EVENT_CARD_FIELDS, EventsService } from '../services/events.service';
import { Event, EventPage } from '../../../shared/models/event.model';

function pageWith(events: Event[]): EventPage {
  return { eventos: events, total: events.length, total_pages: 1, page: 1, size: 9 };
}

describe('EventsComponent search', () => {
  let fixture: ComponentFixture<EventsComponent>;
  let component: EventsComponent;
  let getEvents: jasmine.Spy;
  const emptyPage = pageWith([]);

  beforeEach(() => {
    const eventsServiceMock = jasmine.createSpyObj<EventsService>('EventsService', [
      'getEvents',
      'getStale',
      'getLastRun',
    ]);
    getEvents = eventsServiceMock.getEvents as jasmine.Spy;
    eventsServiceMock.getStale.and.returnValue(null);
    eventsServiceMock.getLastRun.and.returnValue(of({ finished_at: null }));

    TestBed.configureTestingModule({
      providers: [{ provide: EventsService, useValue: eventsServiceMock }],
    });
    TestBed.overrideComponent(EventsComponent, {
      set: { imports: [], template: '' },
    });

    getEvents.and.returnValue(of(emptyPage));
    fixture = TestBed.createComponent(EventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    getEvents.calls.reset();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('debounces rapid search input into a single request with the latest term', fakeAsync(() => {
    getEvents.and.returnValue(of(emptyPage));

    component.onSearchChange('a');
    component.onSearchChange('ab');
    component.onSearchChange('abc');
    expect(getEvents).not.toHaveBeenCalled();

    tick(300);

    expect(getEvents).toHaveBeenCalledTimes(1);
    expect(getEvents).toHaveBeenCalledWith('abc', 1, component.pageSize, EVENT_CARD_FIELDS);
  }));

  it('cancels the obsolete request so an old response never overwrites the recent one', fakeAsync(() => {
    const firstPage = pageWith([{ _id: 'old' } as unknown as Event]);
    const secondPage = pageWith([{ _id: 'new' } as unknown as Event]);
    getEvents.and.callFake((search: string) =>
      search === 'first' ? timer(1000).pipe(map(() => firstPage)) : of(secondPage),
    );

    component.onSearchChange('first');
    tick(300);
    component.onSearchChange('second');
    tick(300);
    tick(1000);

    expect(getEvents).toHaveBeenCalledTimes(2);
    expect(component.events()).toEqual(secondPage.eventos);
  }));

  it('keeps the reload stream alive after a failed request', fakeAsync(() => {
    const okPage = pageWith([{ _id: 'ok' } as unknown as Event]);
    getEvents.and.returnValues(throwError(() => new Error('boom')), of(okPage));

    component.loadEvents();
    tick();
    expect(component.events()).toEqual([]);

    component.loadEvents();
    tick();
    expect(component.events()).toEqual(okPage.eventos);
  }));
});
