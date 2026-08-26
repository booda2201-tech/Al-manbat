import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/models/commerce.models';
import { IMG } from '../../core/data/images';
import { CatalogService } from '../../core/services/catalog.service';
import { RecentlyViewedService } from '../../core/services/ui.service';
import { ProductCardComponent } from '../../shared/components/product-card.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, IconComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  hero = IMG.hero;
  featured: Product[] = [];
  best: Product[] = [];
  recent: Product[] = [];
  cats;
  bestIndex = 0;

  constructor(private catalog: CatalogService, viewed: RecentlyViewedService) {
    this.featured = catalog.featured().slice(0, 8);
    this.best = catalog.bestSellers();
    this.cats = catalog.getCategories();
    this.recent = viewed
      .ids()
      .map((id) => catalog.getById(id))
      .filter((p): p is Product => !!p)
      .slice(0, 4);
    if (!this.recent.length) this.recent = catalog.recentlyAdded().slice(0, 4);
  }

  shift(dir: number): void {
    const max = Math.max(0, this.best.length - 1);
    this.bestIndex = Math.min(max, Math.max(0, this.bestIndex + dir));
  }

  visibleBest(): Product[] {
    return this.best.slice(this.bestIndex, this.bestIndex + 4);
  }
}
