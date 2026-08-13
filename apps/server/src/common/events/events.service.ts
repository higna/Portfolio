import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class EventsService {
  private events = new Subject<any>();

  emit(type: string, payload: any) {
    this.events.next({ type, payload, timestamp: new Date().toISOString() });
  }

  getStream() {
    return this.events.asObservable();
  }
}