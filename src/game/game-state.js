/**
 * Finite state machine for Spooky Slicer game states.
 * States: Ready, Countdown, Playing, TimeFrozen, Frenzy, Paused, GameOver, Victory
 */

export const GameStates = {
  READY: 'Ready',
  COUNTDOWN: 'Countdown',
  PLAYING: 'Playing',
  TIME_FROZEN: 'TimeFrozen',
  FRENZY: 'Frenzy',
  PAUSED: 'Paused',
  GAME_OVER: 'GameOver',
  VICTORY: 'Victory'
};

export class GameStateMachine {
  constructor(onStateChange) {
    this.state = GameStates.READY;
    this.previousState = GameStates.READY;
    this.onStateChange = onStateChange;
  }

  transitionTo(nextState, context = {}) {
    if (this.state === nextState) return;

    this.previousState = this.state;
    this.state = nextState;

    if (this.onStateChange) {
      this.onStateChange(this.state, this.previousState, context);
    }
  }

  is(checkState) {
    return this.state === checkState;
  }

  canAcceptGameplayInput() {
    return this.state === GameStates.PLAYING ||
           this.state === GameStates.TIME_FROZEN ||
           this.state === GameStates.FRENZY;
  }

  pause() {
    if (this.canAcceptGameplayInput()) {
      this.transitionTo(GameStates.PAUSED);
      return true;
    }
    return false;
  }

  resume() {
    if (this.state === GameStates.PAUSED) {
      this.transitionTo(this.previousState || GameStates.PLAYING);
      return true;
    }
    return false;
  }
}
