import { ChangeDetectionStrategy, Component, ContentChild, ElementRef, OnDestroy, AfterContentInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'sp-scrollable-table',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './scrollable-table.component.html',
  styleUrl: './scrollable-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollableTableComponent implements AfterContentInit, OnDestroy {
  @ContentChild('scrollViewport', { read: ElementRef }) viewport?: ElementRef<HTMLElement>;

  readonly hasOverflow = signal(false);
  readonly canScrollLeft = signal(false);
  readonly canScrollRight = signal(false);

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private scrollElement?: HTMLElement;

  ngAfterContentInit(): void {
    this.scrollElement = this.viewport?.nativeElement;
    if (!this.scrollElement) return;

    this.scrollElement.addEventListener('scroll', this.updateIndicators, { passive: true });
    this.resizeObserver = new ResizeObserver(this.updateIndicators);
    this.resizeObserver.observe(this.scrollElement);
    if (this.scrollElement.firstElementChild) this.resizeObserver.observe(this.scrollElement.firstElementChild);
    this.mutationObserver = new MutationObserver(this.updateIndicators);
    this.mutationObserver.observe(this.scrollElement, { childList: true, subtree: true });
    this.updateIndicators();
  }

  ngOnDestroy(): void {
    this.scrollElement?.removeEventListener('scroll', this.updateIndicators);
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }

  private readonly updateIndicators = (): void => {
    const element = this.scrollElement;
    if (!element) return;

    const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
    this.hasOverflow.set(maxScroll > 1);
    this.canScrollLeft.set(element.scrollLeft > 1);
    this.canScrollRight.set(element.scrollLeft < maxScroll - 1);

    if (maxScroll > 1) {
      element.setAttribute('role', 'region');
      element.setAttribute('aria-label', 'Tabla desplazable horizontalmente');
      element.setAttribute('tabindex', '0');
    } else {
      element.removeAttribute('role');
      element.removeAttribute('aria-label');
      element.removeAttribute('tabindex');
    }
  };
}
