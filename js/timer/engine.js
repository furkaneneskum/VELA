import { saveTimerState } from '../utils/storage.js';

const POMODORO_MS = 25 * 60 * 1000;

export class TimerEngine {
  constructor(state, onTick, onComplete) {
    this.state = state;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.intervalId = null;
    this.resumeIfRunning();
  }

  get timer() {
    return this.state.timer;
  }

  resumeIfRunning() {
    if (this.timer.running) {
      this.startInterval();
    }
  }

  startInterval() {
    this.stopInterval();
    this.timer.lastTick = Date.now();
    this.intervalId = setInterval(() => this.tick(), 250);
  }

  stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick() {
    const now = Date.now();
    const delta = now - (this.timer.lastTick || now);
    this.timer.lastTick = now;

    if (this.timer.mode === 'stopwatch') {
      this.timer.elapsedMs += delta;
    } else {
      this.timer.pomodoroRemainingMs -= delta;
      if (this.timer.pomodoroRemainingMs <= 0) {
        this.timer.pomodoroRemainingMs = 0;
        this.pause();
        this.onComplete?.('pomodoro');
      }
    }

    saveTimerState(this.state, this.timer);
    this.onTick(this.getDisplayMs());
  }

  getDisplayMs() {
    if (this.timer.mode === 'stopwatch') {
      return this.timer.elapsedMs;
    }
    return this.timer.pomodoroRemainingMs;
  }

  start() {
    if (this.timer.running) return;
    this.timer.running = true;
    this.timer.startedAt = this.timer.startedAt || Date.now();
    this.timer.lastTick = Date.now();
    saveTimerState(this.state, this.timer);
    this.startInterval();
    this.onTick(this.getDisplayMs());
  }

  pause() {
    if (!this.timer.running) return;
    this.timer.running = false;
    saveTimerState(this.state, this.timer);
    this.stopInterval();
    this.onTick(this.getDisplayMs());
  }

  reset() {
    this.pause();
    if (this.timer.mode === 'stopwatch') {
      this.timer.elapsedMs = 0;
      this.timer.startedAt = null;
    } else {
      this.timer.pomodoroRemainingMs = POMODORO_MS;
    }
    saveTimerState(this.state, this.timer);
    this.onTick(this.getDisplayMs());
  }

  setMode(mode) {
    if (this.timer.running) this.pause();
    this.timer.mode = mode;
    if (mode === 'pomodoro') {
      this.timer.pomodoroRemainingMs = POMODORO_MS;
      this.timer.elapsedMs = 0;
    } else {
      this.timer.elapsedMs = 0;
    }
    this.timer.startedAt = null;
    saveTimerState(this.state, this.timer);
    this.onTick(this.getDisplayMs());
  }

  setSubject(subject) {
    this.timer.subject = subject;
    saveTimerState(this.state, this.timer);
  }

  setTopic(topic) {
    this.timer.topic = topic;
    saveTimerState(this.state, this.timer);
  }

  getSessionDuration() {
    if (this.timer.mode === 'stopwatch') {
      return this.timer.elapsedMs;
    }
    return POMODORO_MS - this.timer.pomodoroRemainingMs;
  }

  clearSession() {
    if (this.timer.mode === 'stopwatch') {
      this.timer.elapsedMs = 0;
      this.timer.startedAt = null;
    } else {
      this.timer.pomodoroRemainingMs = POMODORO_MS;
    }
    saveTimerState(this.state, this.timer);
    this.onTick(this.getDisplayMs());
  }

  destroy() {
    this.stopInterval();
  }
}

export { POMODORO_MS };
