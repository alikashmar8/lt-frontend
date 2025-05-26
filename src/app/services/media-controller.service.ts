import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MediaControllerService {
  // Track currently active player ID
  private activePlayerIdSubject = new BehaviorSubject<string | null>(null);
  private playerStopSignal = new Subject<string>();

  // Observable to notify components about active player changes
  public activePlayerId$ = this.activePlayerIdSubject.asObservable();
  public playerStopSignal$ = this.playerStopSignal.asObservable();

  constructor() {}

  // Register a player as active and stop others
  registerActivePlayer(playerId: string): void {
    const currentActiveId = this.activePlayerIdSubject.getValue();

    // If different player, stop the previous one
    if (currentActiveId && currentActiveId !== playerId) {
      this.playerStopSignal.next(currentActiveId);
    }

    // Set this player as active
    this.activePlayerIdSubject.next(playerId);
  }

  // Deregister a player (when it's paused or ended)
  deregisterActivePlayer(playerId: string): void {
    const currentActiveId = this.activePlayerIdSubject.getValue();
    if (currentActiveId === playerId) {
      this.activePlayerIdSubject.next(null);
    }
  }
}
