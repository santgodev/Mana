import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-table-timer',
    standalone: true,
    template: `
    <div class="timer-badge" [class.warning]="isWarning" [class.danger]="isDanger">
      {{ displayTime }}
    </div>
  `,
    styles: [`
    .timer-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      background-color: #28a745; /* Success Green */
      color: white;
      font-size: 0.9rem;
    }
    .timer-badge.warning {
      background-color: #ffc107; /* Warning Yellow */
      color: black;
    }
    .timer-badge.danger {
      background-color: #dc3545; /* Danger Red */
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `]
})
export class TableTimerComponent implements OnInit, OnDestroy {
    @Input() startTime!: string;
    @Input() idealDurationMinutes: number = 60;

    displayTime: string = '00:00';
    isWarning: boolean = false;
    isDanger: boolean = false;
    private timerSub: Subscription | null = null;

    ngOnInit() {
        if (this.startTime) {
            this.startTimer();
        }
    }

    ngOnDestroy() {
        this.timerSub?.unsubscribe();
    }

    private startTimer() {
        this.timerSub = interval(1000).subscribe(() => {
            this.updateTime();
        });
        this.updateTime(); // Initial call
    }

    private updateTime() {
        const start = new Date(this.startTime).getTime();
        const now = new Date().getTime();
        const diff = now - start;

        const totalSeconds = Math.floor(diff / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        this.displayTime = `${this.pad(minutes)}:${this.pad(seconds)}`;

        const elapsedMinutes = diff / 1000 / 60;

        // Logic for warnings
        if (elapsedMinutes >= this.idealDurationMinutes) {
            this.isDanger = true;
            this.isWarning = false;
        } else if (elapsedMinutes >= this.idealDurationMinutes * 0.8) {
            this.isWarning = true;
            this.isDanger = false;
        } else {
            this.isWarning = false;
            this.isDanger = false;
        }
    }

    private pad(num: number): string {
        return num < 10 ? '0' + num : num.toString();
    }
}
