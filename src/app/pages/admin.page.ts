import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, from, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { unwrapPayload } from '../api/api.util';
import type { ApiCategory, ApiProduct } from '../api/api.models';
import { PagerComponent } from '../commerce/commerce.component';
import { LocaleService } from '../services/locale.service';
import { CatalogService } from '../services/catalog.service';
import { AdminApiService } from '../services/admin-api.service';
import { AuthApiService } from '../services/auth-api.service';
import { SessionService } from '../services/session.service';
import { StoreService } from '../services/store.service';
import type { ApiOrderStatus, Order } from '../types';
import { parseApiStatus } from '../services/account-api.service';
import { CountPipe, SarPipe } from '../utils/sar.pipe';
import { IconComponent } from '../ui/icon.component';
import { LogoComponent } from '../ui/logo.component';
import { compressImageForUpload, fileFromRemoteUrl } from '../utils/image-file';

interface ProductImageSlot {
  preview: string;
  remote?: string;
  file?: File;
  broken?: boolean;
}

interface ProductDraft {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  categoryId: number;
  images: ProductImageSlot[];
  isNew: boolean;
  isAvailable: boolean;
  hasOffer: boolean;
  discountPercent: number;
  discountDays: number;
  deliveryAr: string;
  deliveryEn: string;
  sizeAr: string;
  sizeEn: string;
  originAr: string;
  originEn: string;
  varietyAr: string;
  varietyEn: string;
  acidity: number | null;
  harvestAr: string;
  harvestEn: string;
  highlightsAr: string;
  highlightsEn: string;
}

interface CategoryDraft {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, LogoComponent, SarPipe, CountPipe, PagerComponent],
  templateUrl: './admin.page.html',
})
export class AdminPageComponent implements OnInit, OnDestroy {
  tab = 'overview';
  loading = true;
  saving = false;
  products: ApiProduct[] = [];
  categories: ApiCategory[] = [];
  orders: Order[] = [];
  ordersError = '';
  ordersLoading = false;
  private enrichedIds = new Set<string>();
  query = '';
  orderQuery = '';
  orderFilter: 'all' | ApiOrderStatus = 'all';
  page = 1;
  pageSize = 24;
  orderPageSize = 9;
  statusMenuId = '';
  openOrderId = '';
  boardLane: 'all' | ApiOrderStatus = 'all';
  filterCategoryId = 0;
  selectedOfferId: number | null = null;
  selectedProductId: number | null = null;
  selectedCategoryId: number | null = null;
  productFormOpen = false;
  categoryFormOpen = false;
  editingProduct: ApiProduct | null = null;
  editingCategory: ApiCategory | null = null;
  productDraft = emptyProduct(0);
  categoryDraft = emptyCategory();
  dropActive = false;
  uploadingImages = false;
  private dragDepth = 0;
  private galleryPersistQueued = false;

  get dropZoneClass(): string {
    return this.dropActive ? 'admin-drop is-on' : 'admin-drop';
  }

  constructor(
    public locale: LocaleService,
    public session: SessionService,
    private admin: AdminApiService,
    private catalog: CatalogService,
    private auth: AuthApiService,
    private store: StoreService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.store.menuOpen.set(false);
    this.store.searchOpen.set(false);
    this.store.cartOpen.set(false);
    this.route.queryParamMap.subscribe((q) => {
      const tab = q.get('tab') || 'overview';
      this.applyTab(tab);
    });
    this.refresh();
  }

  ngOnDestroy(): void {
    this.statusMenuId = '';
    this.revokeProductImages();
  }

  readonly navItems = [
    { id: 'overview', labelKey: 'adminOverview' as const, icon: 'grid' },
    { id: 'products', labelKey: 'adminProducts' as const, icon: 'package' },
    { id: 'categories', labelKey: 'adminCategories' as const, icon: 'list' },
    { id: 'offers', labelKey: 'adminOffers' as const, icon: 'zap' },
    { id: 'orders', labelKey: 'adminOrders' as const, icon: 'truck' },
  ];

  get trail() {
    return [{ label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' }, { label: this.locale.ui('adminPanel') }];
  }

  trackNav(_: number, item: { id: string }): string {
    return item.id;
  }

  get greeting(): string {
    const name = this.session.userName() || '';
    return this.locale.isAr() ? `أهلاً ${name || 'بالمدير'}` : `Welcome, ${name || 'admin'}`;
  }

  get stats() {
    return [
      { tab: 'products', labelAr: 'المنتجات', labelEn: 'Products', value: this.products.length, icon: 'package' },
      { tab: 'categories', labelAr: 'الأقسام', labelEn: 'Categories', value: this.categories.length, icon: 'list' },
      { tab: 'offers', labelAr: 'العروض', labelEn: 'Offers', value: this.offerList.length, icon: 'zap' },
      { tab: 'orders', labelAr: 'الطلبات', labelEn: 'Orders', value: this.orders.length, icon: 'truck' },
    ];
  }

  get recentOrders(): Order[] {
    return this.orders.slice(0, 8);
  }

  get pendingOrdersCount(): number {
    return this.orders.filter((o) => this.orderApiStatus(o) === 'Pending').length;
  }

  get pendingOrders(): Order[] {
    return this.orders.filter((o) => this.orderApiStatus(o) === 'Pending').slice(0, 6);
  }

  get latestProducts(): ApiProduct[] {
    return this.products.slice(0, 8);
  }

  get latestOffers(): ApiProduct[] {
    return this.offerList.slice(0, 8);
  }

  get boardColumns(): Array<{ id: ApiOrderStatus; ar: string; en: string }> {
    return this.orderStatuses;
  }

  get tabTitle(): string {
    const item = this.navItems.find((n) => n.id === this.tab);
    return item ? this.locale.ui(item.labelKey) : this.locale.ui('adminPanel');
  }

  get filteredProducts(): ApiProduct[] {
    return this.applyListFilters(this.products);
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
  }

  get pagedProducts(): ApiProduct[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get offerList(): ApiProduct[] {
    return this.products.filter((p) => !!p.hasOffer || (p.discountPercent ?? 0) > 0);
  }

  get filteredOffers(): ApiProduct[] {
    return this.applyListFilters(this.offerList);
  }

  get offerPageCount(): number {
    return Math.max(1, Math.ceil(this.filteredOffers.length / this.pageSize));
  }

  get pagedOffers(): ApiProduct[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredOffers.slice(start, start + this.pageSize);
  }

  get orderFilters(): Array<{ id: 'all' | ApiOrderStatus; ar: string; en: string }> {
    return [
      { id: 'all', ar: 'الكل', en: 'All' },
      { id: 'Pending', ar: 'جديد', en: 'Pending' },
      { id: 'Confirmed', ar: 'مؤكد', en: 'Confirmed' },
      { id: 'Shipped', ar: 'في الطريق', en: 'Shipped' },
      { id: 'Delivered', ar: 'تم التسليم', en: 'Delivered' },
      { id: 'Cancelled', ar: 'ملغي', en: 'Cancelled' },
    ];
  }

  get orderStatuses(): Array<{ id: ApiOrderStatus; ar: string; en: string }> {
    return this.orderFilters.filter((f): f is { id: ApiOrderStatus; ar: string; en: string } => f.id !== 'all');
  }

  get filteredOrders(): Order[] {
    const q = this.orderQuery.trim().toLowerCase();
    return this.orders.filter((o) => {
      if (this.orderFilter !== 'all' && this.orderApiStatus(o) !== this.orderFilter) return false;
      if (!q) return true;
      const names = o.itemIds.map((id) => this.lineName(o, id)).join(' ');
      const hay = [o.id, names, o.customerName, o.customerPhone, o.customerAddress].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  get orderPageCount(): number {
    return Math.max(1, Math.ceil(this.queuedOrders.length / this.orderPageSize));
  }

  get pagedOrders(): Order[] {
    const count = this.orderPageCount;
    const page = Math.min(Math.max(this.page, 1), count);
    const start = (page - 1) * this.orderPageSize;
    return this.queuedOrders.slice(start, start + this.orderPageSize);
  }

  setOrderFilter(id: 'all' | ApiOrderStatus): void {
    this.orderFilter = id;
    this.page = 1;
    this.enrichVisibleOrders();
  }

  onOrderQuery(): void {
    this.page = 1;
    this.enrichVisibleOrders();
  }

  orderChipClass(id: 'all' | ApiOrderStatus): string {
    return this.orderFilter === id
      ? 'bg-olive-800 text-sand-50'
      : 'bg-white text-olive-800 ring-1 ring-olive-800/15';
  }

  orderApiStatus(o: Order): ApiOrderStatus {
    return o.apiStatus || parseApiStatus(o.status) || 'Pending';
  }

  setCategory(id: number, ev?: Event): void {
    this.filterCategoryId = id;
    this.page = 1;
    const btn = ev?.currentTarget as HTMLElement | undefined;
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  categoryCount(id: number): number {
    const rows = this.isTab('offers') ? this.offerList : this.products;
    if (!id) return rows.length;
    return rows.filter((p) => p.categoryId === id).length;
  }

  categoryChipClass(id: number): string {
    return this.filterCategoryId === id ? 'admin-cats__btn is-on' : 'admin-cats__btn';
  }

  ordersInColumn(id: ApiOrderStatus): Order[] {
    const q = this.orderQuery.trim().toLowerCase();
    return this.orders.filter((o) => {
      if (this.orderApiStatus(o) !== id) return false;
      if (!q) return true;
      const names = o.itemIds.map((itemId) => this.lineName(o, itemId)).join(' ');
      const hay = [o.id, names, o.customerName, o.customerPhone, o.customerAddress].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  get activeLane(): 'all' | ApiOrderStatus {
    if (this.boardLane === 'all') return 'all';
    const cols = this.boardColumns;
    if (cols.some((col) => col.id === this.boardLane)) return this.boardLane;
    return 'all';
  }

  get queriedOrders(): Order[] {
    const q = this.orderQuery.trim().toLowerCase();
    if (!q) return this.orders;
    return this.orders.filter((o) => {
      const names = o.itemIds.map((id) => this.lineName(o, id)).join(' ');
      const hay = [o.id, names, o.customerName, o.customerPhone, o.customerAddress]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  get queuedOrders(): Order[] {
    if (this.activeLane === 'all') return this.queriedOrders;
    return this.ordersInColumn(this.activeLane);
  }

  filterCount(id: 'all' | ApiOrderStatus): number {
    return id === 'all' ? this.queriedOrders.length : this.ordersInColumn(id).length;
  }

  hotKicker(order: Order): string {
    const status = this.orderApiStatus(order);
    const ar = this.locale.isAr();
    if (status === 'Pending') return ar ? 'على الطاولة — أكّد' : 'On the counter — confirm';
    if (status === 'Confirmed') return ar ? 'اتجهّز — طلّعه للتوصيل' : 'Packed — send it out';
    if (status === 'Shipped') return ar ? 'في الطريق — وصّله' : 'On the road — mark delivered';
    if (status === 'Delivered') return ar ? 'اتسلّم' : 'Delivered';
    if (status === 'Cancelled') return ar ? 'ملغي' : 'Cancelled';
    return ar ? 'على الطاولة' : 'On the counter';
  }

  nextActionLabel(order: Order): string {
    const next = this.nextStatus(order);
    const ar = this.locale.isAr();
    if (next === 'Confirmed') return ar ? 'أكّد الطلب' : 'Confirm order';
    if (next === 'Shipped') return ar ? 'طلّع للتوصيل' : 'Send out';
    if (next === 'Delivered') return ar ? 'تم التسليم' : 'Mark delivered';
    return this.nextStatusLabel(order);
  }

  hasOrderActions(order: Order): boolean {
    const status = this.orderApiStatus(order);
    return status !== 'Cancelled' && status !== 'Delivered';
  }

  focusLane(id: 'all' | ApiOrderStatus): void {
    this.boardLane = id;
    this.page = 1;
    this.openOrderId = '';
    this.enrichVisibleOrders();
  }

  columnIcon(id: string): string {
    const map: Record<string, string> = {
      Pending: 'bell',
      Confirmed: 'check-circle',
      Shipped: 'truck',
      Delivered: 'package',
      Cancelled: 'close',
    };
    return map[id] || 'list';
  }

  orderItemCount(order: Order): number {
    if (!order.itemIds.length) return 0;
    return order.itemIds.reduce((sum, id) => sum + (this.orderLine(order, id).qty || 1), 0);
  }

  orderLeadName(order: Order): string {
    const first = order.itemIds[0];
    return first ? this.orderLine(order, first).name : '';
  }

  nextStatus(order: Order): ApiOrderStatus | null {
    const flow: ApiOrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];
    const i = flow.indexOf(this.orderApiStatus(order));
    return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
  }

  nextStatusLabel(order: Order): string {
    const next = this.nextStatus(order);
    if (!next) return '';
    const row = this.orderStatuses.find((s) => s.id === next);
    return row ? (this.locale.isAr() ? row.ar : row.en) : next;
  }

  advanceOrder(order: Order, ev: Event): void {
    ev.stopPropagation();
    const next = this.nextStatus(order);
    if (next) this.changeOrderStatus(order, next);
  }

  orderPreview(order: Order): string {
    const first = order.itemIds[0];
    if (first) {
      const fromLine = this.orderLine(order, first).image;
      if (fromLine) return fromLine;
    }
    const fromSnap = Object.values(order.snapshots || {}).find((row) => row.image)?.image;
    return fromSnap || '';
  }

  trackProduct(_: number, p: ApiProduct): number {
    return p.id;
  }

  trackOrder(_: number, o: Order): string {
    return o.id;
  }

  trackColumn(_: number, col: { id: string }): string {
    return col.id;
  }

  trackCategory(_: number, c: ApiCategory): number {
    return c.id;
  }

  categoryInitial(c: ApiCategory): string {
    return (this.categoryName(c) || 'ق').trim().charAt(0);
  }

  openCategoryShelf(c: ApiCategory): void {
    this.filterCategoryId = c.id;
    this.page = 1;
    this.setTab('products');
  }

  private applyListFilters(rows: ApiProduct[]): ApiProduct[] {
    const q = this.query.trim().toLowerCase();
    return rows.filter((p) => {
      if (this.filterCategoryId && p.categoryId !== this.filterCategoryId) return false;
      if (!q) return true;
      return this.productName(p).toLowerCase().includes(q) || String(p.id).includes(q);
    });
  }

  isTab(id: string): boolean {
    return this.tab === id;
  }

  navClass(id: string): string {
    return this.isTab(id) ? 'admin-rail__link is-on' : 'admin-rail__link';
  }

  dockClass(id: string): string {
    return this.isTab(id) ? 'admin-dock__item is-on' : 'admin-dock__item';
  }

  setTab(id: string, keepForms = false, ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();
    if (this.tab !== id) {
      this.page = 1;
      this.openOrderId = '';
      this.selectedOfferId = null;
      this.selectedProductId = null;
      this.selectedCategoryId = null;
      if (id === 'orders') this.boardLane = 'all';
      if (!keepForms) this.closeForms();
      if (id === 'orders' || id === 'overview') this.ensureOrders(true);
    }
    this.tab = id;
    void this.router.navigate(['/admin'], {
      queryParams: id === 'overview' ? {} : { tab: id },
      replaceUrl: true,
    });
  }

  private applyTab(tab: string): void {
    const allowed = this.navItems.map((n) => n.id);
    const next = allowed.includes(tab) ? tab : 'overview';
    if (next === this.tab) return;
    this.tab = next;
    this.page = 1;
    this.selectedOfferId = null;
    this.selectedProductId = null;
    this.selectedCategoryId = null;
    this.closeForms();
    if (next === 'orders') this.boardLane = 'all';
    if (next === 'orders' || next === 'overview') this.ensureOrders(true);
  }

  productName(p: ApiProduct): string {
    return this.locale.isAr() ? p.nameAr || p.nameEn || p.name || `#${p.id}` : p.nameEn || p.nameAr || p.name || `#${p.id}`;
  }

  categoryName(c: ApiCategory | undefined | null): string {
    if (!c) return '—';
    return this.locale.isAr() ? c.nameAr || c.nameEn || c.name || `#${c.id}` : c.nameEn || c.nameAr || c.name || `#${c.id}`;
  }

  categoryOf(id: number): ApiCategory | undefined {
    return this.categories.find((c) => c.id === id);
  }

  productImage(p: ApiProduct): string {
    return (p.imageUrls ?? []).find(Boolean) || '';
  }

  get selectedOffer(): ApiProduct | null {
    if (this.selectedOfferId == null) return null;
    return this.products.find((p) => p.id === this.selectedOfferId) ?? null;
  }

  selectOffer(p: ApiProduct, ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();
    this.selectedProductId = null;
    this.selectedCategoryId = null;
    this.selectedOfferId = this.selectedOfferId === p.id ? null : p.id;
  }

  selectProduct(p: ApiProduct, ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();
    this.selectedOfferId = null;
    this.selectedCategoryId = null;
    this.selectedProductId = this.selectedProductId === p.id ? null : p.id;
  }

  selectCategory(c: ApiCategory, ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();
    this.selectedOfferId = null;
    this.selectedProductId = null;
    this.selectedCategoryId = this.selectedCategoryId === c.id ? null : c.id;
  }

  closeOfferSheet(): void {
    this.selectedOfferId = null;
    this.selectedProductId = null;
    this.selectedCategoryId = null;
  }

  salePrice(p: ApiProduct): number {
    const price = Number(p.price) || 0;
    const percent = Math.min(90, Math.max(0, Number(p.discountPercent) || 0));
    return Math.round(price * (1 - percent / 100) * 100) / 100;
  }

  clearOffer(p: ApiProduct): void {
    p.discountPercent = 0;
    this.selectedOfferId = null;
    this.saveOffer(p);
  }

  onDragEnter(ev: DragEvent): void {
    ev.preventDefault();
    this.dragDepth += 1;
    this.dropActive = true;
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
  }

  onDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (!this.dragDepth) this.dropActive = false;
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.dragDepth = 0;
    this.dropActive = false;
    this.addProductFiles(ev.dataTransfer?.files);
  }

  onProductImagesPicked(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.addProductFiles(input.files);
    input.value = '';
  }

  removeProductImage(index: number, ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();
    const next = this.productDraft.images.filter((_, i) => i !== index);
    const removed = this.productDraft.images[index];
    this.revokeSlot(removed);
    this.productDraft.images = next;
    if (this.productDraft.id && next.length) this.persistGallery();
  }

  setCoverImage(index: number, ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();
    const next = [...this.productDraft.images];
    const [picked] = next.splice(index, 1);
    if (!picked) return;
    this.productDraft.images = [picked, ...next];
    if (this.productDraft.id) this.persistGallery();
  }

  onSlotImageError(index: number): void {
    const current = this.productDraft.images[index];
    if (!current || current.broken) return;
    const next = [...this.productDraft.images];
    next[index] = { ...current, broken: true };
    this.productDraft.images = next;
  }

  trackProductImage(index: number, img: ProductImageSlot): string {
    return img.remote || img.preview || String(index);
  }

  private addProductFiles(list: FileList | File[] | null | undefined): void {
    const files = Array.from(list ?? []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    const existing = this.productDraft.images;
    const room = Math.max(0, 8 - existing.length);
    if (room <= 0) {
      this.toast(this.locale.isAr() ? 'الحد الأقصى ٨ صور.' : 'Maximum of 8 images.', 'warning');
      return;
    }
    const slots = files.slice(0, room).map((file) => ({
      preview: URL.createObjectURL(file),
      file,
    }));
    if (files.length > room) {
      this.toast(this.locale.isAr() ? 'الحد الأقصى ٨ صور. أُضيف المتاح فقط.' : 'Maximum of 8 images. Extra files were skipped.', 'warning');
    }
    this.productDraft.images = [...existing, ...slots];
    if (this.productDraft.id) this.persistGallery();
  }

  private persistGallery(): void {
    if (!this.productDraft.id) return;
    if (this.saving || this.uploadingImages) {
      this.galleryPersistQueued = true;
      return;
    }
    this.uploadingImages = true;
    from(this.resolveGalleryFiles())
      .pipe(
        switchMap((files) => {
          if (!files.length) return of(null);
          return this.admin.updateProduct(this.toProductDto(), files);
        }),
        finalize(() => {
          this.uploadingImages = false;
          if (this.galleryPersistQueued) {
            this.galleryPersistQueued = false;
            this.persistGallery();
          }
        })
      )
      .subscribe({
        next: (body) => this.afterImageSaved(body),
        error: (err) => this.fail(err),
      });
  }

  private async resolveGalleryFiles(): Promise<File[]> {
    const files: File[] = [];
    for (let i = 0; i < this.productDraft.images.length; i++) {
      const slot = this.productDraft.images[i];
      if (!slot || slot.broken) continue;
      if (slot.file) {
        files.push(await compressImageForUpload(slot.file));
        continue;
      }
      if (slot.remote) {
        try {
          files.push(await compressImageForUpload(await fileFromRemoteUrl(slot.remote, i)));
        } catch {
          /* keep going — remaining files still upload */
        }
      }
    }
    return files;
  }

  private afterImageSaved(body: unknown): void {
    if (this.galleryPersistQueued) {
      this.toast(this.locale.isAr() ? 'جاري حفظ باقي الصور…' : 'Saving remaining images…', 'success');
      return;
    }
    if (!body) return;
    const urls = productImageUrls(body);
    if (urls.length && this.editingProduct) {
      this.editingProduct = { ...this.editingProduct, imageUrls: urls };
      this.setProductDraft(fromProduct(this.editingProduct));
    }
    this.toast(this.locale.isAr() ? 'تم تحديث الصور' : 'Images updated', 'success');
    this.catalog.load().subscribe();
    this.refresh(true);
  }

  private revokeSlot(slot?: ProductImageSlot): void {
    if (slot?.file && slot.preview.startsWith('blob:')) {
      URL.revokeObjectURL(slot.preview);
    }
  }

  private revokeProductImages(): void {
    for (const slot of this.productDraft.images) this.revokeSlot(slot);
  }

  private setProductDraft(next: ProductDraft): void {
    this.revokeProductImages();
    this.productDraft = next;
  }

  goPage(n: number): void {
    this.page = n;
    if (this.tab === 'orders') this.enrichVisibleOrders();
  }

  onQuery(): void {
    this.page = 1;
  }

  openNewProduct(): void {
    this.selectedOfferId = null;
    this.selectedProductId = null;
    this.selectedCategoryId = null;
    this.editingProduct = null;
    this.setProductDraft(emptyProduct(this.categories[0]?.id ?? 0));
    this.productFormOpen = true;
    this.categoryFormOpen = false;
    this.tab = 'products';
    this.page = 1;
    this.setTab('products', true);
    this.revealAdminForm();
  }

  openEditProduct(p: ApiProduct): void {
    this.selectedOfferId = null;
    this.selectedProductId = null;
    this.selectedCategoryId = null;
    this.editingProduct = p;
    this.setProductDraft(fromProduct(p));
    this.productFormOpen = true;
    this.categoryFormOpen = false;
    this.setTab('products', true);
    this.revealAdminForm();
  }

  openNewCategory(): void {
    this.selectedOfferId = null;
    this.selectedProductId = null;
    this.selectedCategoryId = null;
    this.editingCategory = null;
    this.categoryDraft = emptyCategory();
    this.categoryFormOpen = true;
    this.productFormOpen = false;
    this.page = 1;
    this.setTab('categories', true);
    this.revealAdminForm();
  }

  openEditCategory(c: ApiCategory): void {
    this.selectedOfferId = null;
    this.selectedProductId = null;
    this.selectedCategoryId = null;
    this.editingCategory = c;
    this.categoryDraft = fromCategory(c);
    this.categoryFormOpen = true;
    this.revealAdminForm();
  }

  private revealAdminForm(): void {
    this.cdr.detectChanges();
    setTimeout(() => {
      const form = document.querySelector<HTMLElement>('.admin-editor');
      const header = document.querySelector('.admin-top') as HTMLElement | null;
      const offset = (header?.getBoundingClientRect().height ?? 62) + 8;
      const top = form
        ? form.getBoundingClientRect().top + window.scrollY - offset
        : 0;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 0);
  }

  closeForms(): void {
    this.productFormOpen = false;
    this.categoryFormOpen = false;
    this.editingProduct = null;
    this.editingCategory = null;
    this.dropActive = false;
    this.dragDepth = 0;
    this.uploadingImages = false;
    this.galleryPersistQueued = false;
    this.revokeProductImages();
  }

  saveProduct(ev: Event): void {
    ev.preventDefault();
    if (this.saving) return;
    const name = this.productDraft.nameAr.trim() || this.productDraft.nameEn.trim();
    if (!name || !this.productDraft.categoryId) {
      this.toast(this.locale.isAr() ? 'أدخل اسم المنتج واختر القسم.' : 'Enter a product name and category.', 'warning');
      return;
    }
    this.saving = true;
    const dto = this.toProductDto();
    const rewriteGallery = !this.productDraft.id || this.productDraft.images.some((slot) => !!slot.file);
    const req$ = from(rewriteGallery ? this.resolveGalleryFiles() : Promise.resolve([] as File[])).pipe(
      switchMap((files) =>
        this.productDraft.id ? this.admin.updateProduct(dto, files) : this.admin.addProduct(dto, files)
      )
    );
    req$.subscribe({
      next: () => this.afterSave(this.locale.isAr() ? 'تم حفظ المنتج' : 'Product saved'),
      error: (err) => this.fail(err),
    });
  }

  saveCategory(ev: Event): void {
    ev.preventDefault();
    if (this.saving) return;
    const name = this.categoryDraft.nameAr.trim() || this.categoryDraft.nameEn.trim();
    if (!name) {
      this.toast(this.locale.isAr() ? 'أدخل اسم القسم.' : 'Enter a category name.', 'warning');
      return;
    }
    const dto = this.toCategoryDto();
    this.saving = true;
    const req = this.categoryDraft.id ? this.admin.updateCategory(dto) : this.admin.addCategory(dto);
    req.subscribe({
      next: () => this.afterSave(this.locale.isAr() ? 'تم حفظ القسم' : 'Category saved'),
      error: (err) => this.fail(err),
    });
  }

  saveOffer(p: ApiProduct): void {
    if (this.saving) return;
    const percent = Number(p.discountPercent) || 0;
    this.saving = true;
    this.admin
      .updateProduct({ ...p, hasOffer: percent > 0, discountPercent: percent })
      .subscribe({
        next: () => this.afterSave(this.locale.isAr() ? 'تم تحديث العرض' : 'Offer updated'),
        error: (err) => this.fail(err),
      });
  }

  confirmDeleteProduct(p: ApiProduct): void {
    const ok = window.confirm(
      this.locale.isAr() ? `حذف «${this.productName(p)}»؟` : `Delete “${this.productName(p)}”?`
    );
    if (!ok) return;
    this.selectedProductId = null;
    this.saving = true;
    this.admin.deleteProduct(p.id).subscribe({
      next: () => this.afterSave(this.locale.isAr() ? 'تم حذف المنتج' : 'Product deleted'),
      error: (err) => this.fail(err),
    });
  }

  confirmDeleteCategory(c: ApiCategory): void {
    const ok = window.confirm(
      this.locale.isAr() ? `حذف قسم «${this.categoryName(c)}»؟` : `Delete category “${this.categoryName(c)}”?`
    );
    if (!ok) return;
    this.selectedCategoryId = null;
    this.saving = true;
    this.admin.deleteCategory(c.id).subscribe({
      next: () => this.afterSave(this.locale.isAr() ? 'تم حذف القسم' : 'Category deleted'),
      error: (err) => this.fail(err),
    });
  }

  signOut(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.toast(this.locale.isAr() ? 'تم تسجيل الخروج' : 'Signed out', 'success');
        this.router.navigateByUrl('/login');
      },
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(this.locale.isAr() ? 'ar-SA' : 'en-GB');
  }

  formatOrderWhen(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
    const ar = this.locale.isAr();
    if (mins < 1) return ar ? 'الآن' : 'Just now';
    if (mins < 60) return ar ? `منذ ${mins} د` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return ar ? `منذ ${hrs} س` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return ar ? `منذ ${days} يوم` : `${days}d ago`;
    return this.formatDate(iso);
  }

  statusLabel(status: string): string {
    const api = parseApiStatus(status);
    const key = api || status;
    const map: Record<string, { ar: string; en: string }> = {
      Pending: { ar: 'جديد', en: 'Pending' },
      Confirmed: { ar: 'مؤكد', en: 'Confirmed' },
      Shipped: { ar: 'في الطريق', en: 'Shipped' },
      Delivered: { ar: 'تم التسليم', en: 'Delivered' },
      Cancelled: { ar: 'ملغي', en: 'Cancelled' },
      processing: { ar: 'قيد التجهيز', en: 'Processing' },
      in_transit: { ar: 'في الطريق', en: 'In transit' },
      delivered: { ar: 'تم التسليم', en: 'Delivered' },
      cancelled: { ar: 'ملغي', en: 'Cancelled' },
    };
    const row = map[key] || map['processing'];
    return this.locale.isAr() ? row.ar : row.en;
  }

  statusTone(status: string): string {
    const api = parseApiStatus(status) || status;
    const map: Record<string, string> = {
      Pending: 'bg-sand-100 text-olive-800',
      Confirmed: 'bg-olive-800/10 text-olive-800',
      Shipped: 'bg-gold-400 text-olive-900',
      Delivered: 'bg-state-success/12 text-state-success',
      Cancelled: 'bg-state-danger/12 text-state-danger',
      processing: 'bg-sand-100 text-olive-800',
      in_transit: 'bg-gold-400 text-olive-900',
      delivered: 'bg-state-success/12 text-state-success',
      cancelled: 'bg-state-danger/12 text-state-danger',
    };
    return map[api] || map['processing'];
  }

  lineName(order: Order, id: string): string {
    return this.orderLine(order, id).name;
  }

  lineMeta(order: Order, id: string): string {
    return `× ${this.orderLine(order, id).qty}`;
  }

  orderLine(order: Order, id: string): { name: string; image: string; qty: number; price?: number } {
    const snap = order.snapshots?.[id];
    const product = this.catalog.byId(id);
    const api = this.products.find((p) => String(p.id) === String(id));
    return {
      name: snap?.name || (product ? this.locale.tr(product.name) : api ? this.productName(api) : id),
      image: snap?.image || product?.image || (api ? this.productImage(api) : ''),
      qty: snap?.qty || 1,
      price: snap?.price || product?.price || api?.finalPrice || api?.price,
    };
  }

  hideBrokenImage(ev: Event): void {
    const el = ev.target as HTMLImageElement | null;
    if (el) el.style.display = 'none';
  }

  toggleStatusMenu(id: string, ev: Event): void {
    ev.stopPropagation();
    this.statusMenuId = this.statusMenuId === id ? '' : id;
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.statusMenuId = '';
    this.selectedOfferId = null;
    this.selectedProductId = null;
    this.selectedCategoryId = null;
  }

  pickOrderStatus(order: Order, next: string, ev: Event): void {
    ev.stopPropagation();
    this.statusMenuId = '';
    this.changeOrderStatus(order, next);
  }

  changeOrderStatus(order: Order, next: string): void {
    if (this.saving) return;
    const status = parseApiStatus(next);
    if (!status || status === this.orderApiStatus(order)) return;
    if (status === 'Cancelled') {
      const ok = window.confirm(
        this.locale.isAr() ? `إلغاء الطلب رقم ${order.id}؟` : `Cancel order ${order.id}?`
      );
      if (!ok) return;
    }
    this.saving = true;
    this.admin.updateOrderStatus(order.id, status).subscribe({
      next: () => {
        this.saving = false;
        order.apiStatus = status;
        order.status =
          status === 'Delivered'
            ? 'delivered'
            : status === 'Shipped'
              ? 'in_transit'
              : status === 'Cancelled'
                ? 'cancelled'
                : 'processing';
        this.toast(this.locale.isAr() ? 'تم تحديث حالة الطلب' : 'Order status updated', 'success');
      },
      error: (err) => this.fail(err),
    });
  }

  private refresh(silent = false): void {
    if (!silent) this.loading = true;
    forkJoin({
      products: this.admin.getProducts().pipe(catchError(() => of([] as ApiProduct[]))),
      categories: this.admin.getCategories().pipe(catchError(() => of([] as ApiCategory[]))),
    }).subscribe(({ products, categories }) => {
      this.products = products ?? [];
      this.categories = categories ?? [];
      this.loading = false;
      this.ensureOrders(this.tab === 'orders' || this.tab === 'overview');
    });
  }

  private ensureOrders(enrich = false): void {
    if (this.orders.length) {
      if (enrich) this.enrichVisibleOrders();
      return;
    }
    if (this.ordersLoading) return;
    this.ordersLoading = true;
    this.ordersError = '';
    this.admin.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders ?? [];
        this.ordersLoading = false;
        if (enrich || this.tab === 'orders' || this.tab === 'overview') this.enrichVisibleOrders();
      },
      error: (err) => {
        this.ordersLoading = false;
        this.ordersError = err instanceof Error && err.message ? err.message : '';
      },
    });
  }

  private enrichOne(order: Order): void {
    if (this.enrichedIds.has(order.id) && order.customerName && order.customerPhone) return;
    this.enrichedIds.add(order.id);
    this.admin.enrichOrders([order]).subscribe((updated) => {
      const next = updated[0];
      if (!next) return;
      this.orders = this.orders.map((row) => (row.id === next.id ? next : row));
    });
  }

  private enrichVisibleOrders(): void {
    const target =
      this.tab === 'overview'
        ? this.pendingOrders
        : this.tab === 'orders'
          ? this.pagedOrders
          : this.pagedOrders;
    const pending = target.filter(
      (order) =>
        !this.enrichedIds.has(order.id) &&
        !(order.customerName && order.customerPhone && order.customerAddress)
    );
    if (!pending.length) return;
    pending.forEach((order) => this.enrichedIds.add(order.id));
    this.admin.enrichOrders(pending).subscribe((updated) => {
      const byId = new Map(updated.map((row) => [row.id, row]));
      this.orders = this.orders.map((order) => byId.get(order.id) || order);
    });
  }

  private afterSave(title: string): void {
    this.saving = false;
    this.closeForms();
    this.toast(title, 'success');
    this.catalog.load().subscribe();
    this.refresh();
  }

  private fail(err: unknown): void {
    this.saving = false;
    const message = err instanceof Error && err.message ? err.message : '';
    this.toast(message || (this.locale.isAr() ? 'تعذر الحفظ. حاول مرة أخرى.' : 'Could not save. Try again.'), 'warning');
  }

  private toast(title: string, tone: 'success' | 'warning'): void {
    this.store.pushToast({ title, tone });
  }

  private toProductDto(): Partial<ApiProduct> {
    const percent = Number(this.productDraft.discountPercent) || 0;
    const offered = this.productDraft.hasOffer || percent > 0;
    const acidity = this.productDraft.acidity == null ? NaN : Number(this.productDraft.acidity);
    return {
      ...(this.editingProduct ?? {}),
      id: this.productDraft.id || undefined,
      nameAr: this.productDraft.nameAr.trim(),
      nameEn: this.productDraft.nameEn.trim(),
      descriptionAr: this.productDraft.descriptionAr.trim(),
      descriptionEn: this.productDraft.descriptionEn.trim(),
      price: Number(this.productDraft.price) || 0,
      categoryId: Number(this.productDraft.categoryId),
      imageUrls: this.productDraft.images.map((slot) => slot.remote).filter((url): url is string => !!url),
      isNew: this.productDraft.isNew,
      isAvailable: this.productDraft.isAvailable,
      hasOffer: offered,
      discountPercent: offered ? percent : 0,
      discountDays: offered ? Number(this.productDraft.discountDays) || 7 : 0,
      deliveryAr: this.productDraft.deliveryAr.trim(),
      deliveryEn: this.productDraft.deliveryEn.trim(),
      sizeAr: this.productDraft.sizeAr.trim(),
      sizeEn: this.productDraft.sizeEn.trim(),
      originAr: this.productDraft.originAr.trim(),
      originEn: this.productDraft.originEn.trim(),
      varietyAr: this.productDraft.varietyAr.trim(),
      varietyEn: this.productDraft.varietyEn.trim(),
      acidity: acidity != null && Number.isFinite(acidity) ? acidity : null,
      harvestAr: this.productDraft.harvestAr.trim(),
      harvestEn: this.productDraft.harvestEn.trim(),
      highlightsAr: splitHighlights(this.productDraft.highlightsAr),
      highlightsEn: splitHighlights(this.productDraft.highlightsEn),
    };
  }

  private toCategoryDto(): Partial<ApiCategory> {
    return {
      ...(this.editingCategory ?? {}),
      id: this.categoryDraft.id || undefined,
      nameAr: this.categoryDraft.nameAr.trim(),
      nameEn: this.categoryDraft.nameEn.trim(),
      descriptionAr: this.categoryDraft.descriptionAr.trim(),
      descriptionEn: this.categoryDraft.descriptionEn.trim(),
      imageUrl: this.categoryDraft.imageUrl.trim() || null,
    };
  }
}

function emptyProduct(categoryId: number): ProductDraft {
  return {
    id: 0,
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    price: 0,
    categoryId,
    images: [],
    isNew: true,
    isAvailable: true,
    hasOffer: false,
    discountPercent: 0,
    discountDays: 7,
    deliveryAr: '',
    deliveryEn: '',
    sizeAr: '',
    sizeEn: '',
    originAr: '',
    originEn: '',
    varietyAr: '',
    varietyEn: '',
    acidity: null,
    harvestAr: '',
    harvestEn: '',
    highlightsAr: '',
    highlightsEn: '',
  };
}

function fromProduct(p: ApiProduct): ProductDraft {
  return {
    id: p.id,
    nameAr: p.nameAr || p.name || '',
    nameEn: p.nameEn || p.name || '',
    descriptionAr: p.descriptionAr || p.description || '',
    descriptionEn: p.descriptionEn || p.description || '',
    price: p.price ?? 0,
    categoryId: p.categoryId,
    images: (p.imageUrls ?? []).filter(Boolean).map((url) => ({
      preview: url,
      remote: isRemoteImageUrl(url) ? url : undefined,
    })),
    isNew: !!p.isNew,
    isAvailable: p.isAvailable !== false,
    hasOffer: !!p.hasOffer || (p.discountPercent ?? 0) > 0,
    discountPercent: p.discountPercent ?? 0,
    discountDays: p.discountDays || p.discountDaysRemaining || 7,
    deliveryAr: p.deliveryAr || p.delivery || '',
    deliveryEn: p.deliveryEn || p.delivery || '',
    sizeAr: p.sizeAr || p.size || '',
    sizeEn: p.sizeEn || p.size || '',
    originAr: p.originAr || p.origin || '',
    originEn: p.originEn || p.origin || '',
    varietyAr: p.varietyAr || p.variety || '',
    varietyEn: p.varietyEn || p.variety || '',
    acidity: p.acidity ?? null,
    harvestAr: p.harvestAr || p.harvest || '',
    harvestEn: p.harvestEn || p.harvest || '',
    highlightsAr: joinHighlights(p.highlightsAr, p.highlights),
    highlightsEn: joinHighlights(p.highlightsEn, p.highlights),
  };
}

function joinHighlights(value?: string[] | null, fallback?: string[] | null): string {
  const rows = (value?.length ? value : fallback) ?? [];
  return rows.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()).join('\n');
}

function splitHighlights(text: string): string[] {
  return text.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
}

function emptyCategory(): CategoryDraft {
  return { id: 0, nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '', imageUrl: '' };
}

function fromCategory(c: ApiCategory): CategoryDraft {
  return {
    id: c.id,
    nameAr: c.nameAr || c.name || '',
    nameEn: c.nameEn || c.name || '',
    descriptionAr: c.descriptionAr || c.description || '',
    descriptionEn: c.descriptionEn || c.description || '',
    imageUrl: c.imageUrl || '',
  };
}

function isRemoteImageUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || (url.startsWith('/') && !url.startsWith('//'));
}

function productImageUrls(body: unknown): string[] {
  const inner = unwrapPayload(body);
  const record = inner && typeof inner === 'object' ? (inner as Record<string, unknown>) : null;
  const urls = record?.['imageUrls'];
  if (!Array.isArray(urls)) return [];
  return urls.map((item) => String(item || '').trim()).filter(Boolean);
}
