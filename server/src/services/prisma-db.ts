/**
 * Data layer PostgreSQL via Prisma — implementasi kembar dari `data.ts`
 * dengan signature identik. Dipakai saat DATA_ENGINE=postgres.
 */
import { getPrisma } from './prisma-client.js';
import type { SessionUser } from './session.js';
// Removed memory import

type Doc = Record<string, any>;

const toIso = (d: Date) => d.toISOString();

// ── Users ──

export async function getUserDoc(userId: string): Promise<Doc | null> {
  const u = await getPrisma().user.findUnique({ where: { id: userId } });
  if (!u) return null;
  return { ...u };
}

export async function upsertUserDoc(user: SessionUser): Promise<Doc> {
  const data = {
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    photoUrl: user.photoUrl ?? null,
    selectedArea: user.selectedArea ?? null,
  };
  const existing = await getPrisma().user.findUnique({ where: { email: user.email } });
  if (existing) {
    const u = await getPrisma().user.update({ where: { id: existing.id }, data });
    return { ...u };
  }
  const u = await getPrisma().user.create({ data: { ...data, id: user.id } });
  return { ...u };
}

export async function updateUserDoc(userId: string, data: Doc): Promise<Doc> {
  const allowed = toUpdatable(data, ['name', 'email', 'phone', 'photoUrl', 'selectedArea', 'role']);
  const u = await getPrisma().user.update({ where: { id: userId }, data: allowed });
  return { ...u };
}

// ── Orders ──

export async function createOrder(data: Doc): Promise<Doc> {
  const o = await getPrisma().order.create({
    data: {
      id: (data.$id as string) || undefined,
      userId: data.userId as string,
      serviceName: (data.serviceName as string) ?? '',
      title: (data.title as string) ?? '',
      description: (data.description as string) ?? null,
      status: (data.status as any) ?? 'ongoing',
      statusText: (data.statusText as string) ?? null,
      totalAmount: Number(data.totalAmount ?? 0),
      jastiperId: (data.jastiperId as string) ?? null,
      jastiperName: (data.jastiperName as string) ?? null,
      jastiperPhone: (data.jastiperPhone as string) ?? null,
      jastiperAvatar: (data.jastiperAvatar as string) ?? null,
      pickupAddress: (data.pickupAddress as string) ?? null,
      deliveryAddress: (data.deliveryAddress as string) ?? null,
      chatRoomId: (data.chatRoomId as string) ?? null,
      danaBelanja: Number(data.danaBelanja ?? 0),
      ongkir: Number(data.ongkir ?? 0),
      biayaLayanan: Number(data.biayaLayanan ?? 0),
      pickupLat: numOrNull(data.pickupLat),
      pickupLng: numOrNull(data.pickupLng),
      dropoffLat: numOrNull(data.dropoffLat),
      dropoffLng: numOrNull(data.dropoffLng),
      jastiperLat: numOrNull(data.jastiperLat),
      jastiperLng: numOrNull(data.jastiperLng),
      jarakKm: numOrNull(data.jarakKm),
      estimasiWaktu: (data.estimasiWaktu as string) ?? null,
      escrowId: (data.escrowId as string) ?? null,
      totalBelanjaStruk: numOrNull(data.totalBelanjaStruk),
      strukImageUrl: (data.strukImageUrl as string) ?? null,
      deliveryProofUrl: (data.deliveryProofUrl as string) ?? null,
      refundCustomer: numOrNull(data.refundCustomer),
      kebijakanLebih: (data.kebijakanLebih as any) ?? 'jangan_lebih',
      pendingApproval: Boolean(data.pendingApproval ?? false),
      requestedTopup: numOrNull(data.requestedTopup),
      voucherCode: (data.voucherCode as string) ?? null,
      voucherDiscount: numOrNull(data.voucherDiscount),
      orderType: (data.orderType as any) ?? 'jastip',
    },
  });
  return normalizeOrder(o);
}

export async function listOrders(userId: string): Promise<Doc[]> {
  const rows = await getPrisma().order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return rows.map(normalizeOrder);
}

export async function getOrder(_orderId: string): Promise<Doc | null> {
  const o = await getPrisma().order.findUnique({ where: { id: orderId } });
  return o ? normalizeOrder(o) : null;
}

export async function updateOrder(_orderId: string, data: Doc): Promise<Doc> {
  const allowed = toUpdatable(data, [
    'status',
    'statusText',
    'jastiperId',
    'jastiperName',
    'jastiperPhone',
    'jastiperAvatar',
    'jastiperLat',
    'jastiperLng',
    'totalBelanjaStruk',
    'strukImageUrl',
    'deliveryProofUrl',
    'refundCustomer',
    'pendingApproval',
    'requestedTopup',
    'danaBelanja',
    'totalAmount',
    'reviewRating',
    'reviewText',
    'customerConfirmed',
    'needsAdminReview',
    'adminReviewed',
  ]);
  const o = await getPrisma().order.update({ where: { id: orderId }, data: allowed });
  return normalizeOrder(o);
}

/** Order ongoing tanpa kurir — daftar "Tersedia" untuk app driver. */
export async function listAvailableOrders(): Promise<Doc[]> {
  const rows = await getPrisma().order.findMany({
    where: { status: 'ongoing', OR: [{ jastiperId: null }, { jastiperId: '' }] },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return rows.map(normalizeOrder);
}

/** Semua order milik satu kurir (accepted/completed/cancelled). */
export async function listJastiperOrders(userId: string): Promise<Doc[]> {
  const jastiper = await getPrisma()
    .jastiper.findUnique({ where: { id: userId } })
    .catch(() => null);
  const jId = jastiper ? jastiper.id : userId;
  const rows = await getPrisma().order.findMany({
    where: { jastiperId: jId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return rows.map(normalizeOrder);
}

/**
 * Terima order secara atomik: update hanya berhasil bila jastiperId masih kosong.
 * Mencegah dua kurir menerima order yang sama bersamaan (race condition).
 */
export async function acceptOrder(_orderId: string, patch: Doc): Promise<Doc | null> {
  try {
    const res = await getPrisma().order.updateMany({
      where: { id: orderId, status: 'ongoing', OR: [{ jastiperId: null }, { jastiperId: '' }] },
      data: toUpdatable(patch, [
        'jastiperId',
        'jastiperName',
        'jastiperPhone',
        'jastiperAvatar',
        'statusText',
      ]),
    });
    if (res.count === 0) return null;
    return getOrder(orderId);
  } catch {
    return null; // sudah diambil kurir lain / tidak lagi ongoing
  }
}

// ── Withdrawals ──

export async function createWithdrawal(data: Doc): Promise<Doc> {
  const w = await getPrisma().withdrawal.create({
    data: {
      userId: data.userId as string,
      amount: Number(data.amount ?? 0),
      bankName: (data.bankName as string) ?? '',
      accountNumber: (data.accountNumber as string) ?? '',
      status: (data.status as any) ?? 'pending',
    },
  });
  return normalizeWithdrawal(w);
}

export async function listWithdrawalsByUser(userId: string): Promise<Doc[]> {
  const rows = await getPrisma().withdrawal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(normalizeWithdrawal);
}

export async function listChatMessages(_orderId: string): Promise<Doc[]> {
  const rows = await getPrisma().chatMessage.findMany({
    where: { orderId },
    orderBy: { timestamp: 'asc' },
  });
  return rows.map((m) => ({ $id: m.id, ...m }));
}

export async function listAllChatMessages(): Promise<Doc[]> {
  try {
    const rows = await getPrisma().chatMessage.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200,
    });
    return rows.map((m) => ({ $id: m.id, ...m }));
  } catch {
    return [];
  }
}

export async function createChatMessage(data: Doc): Promise<Doc> {
  const m = await getPrisma().chatMessage.create({
    data: {
      orderId: data.orderId as string,
      senderId: data.senderId as string,
      senderName: (data.senderName as string) ?? null,
      senderRole: (data.senderRole as any) ?? 'customer',
      message: (data.message as string) ?? null,
      messageType: (data.messageType as any) ?? 'text',
      mediaUrl: (data.mediaUrl as string) ?? null,
      timestamp: data.timestamp ? new Date(data.timestamp as string) : undefined,
    },
  });
  return { $id: m.id, ...m };
}

// ── Notifications ──

export async function listNotifications(userId: string): Promise<Doc[]> {
  const rows = await getPrisma().notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return rows.map((n) => ({ $id: n.id, ...n }));
}

export async function createNotification(data: {
  userId: string;
  category: string;
  title: string;
  body: string;
  routeName?: string;
  routeExtra?: string;
}): Promise<Doc> {
  const n = await getPrisma().notification.create({
    data: {
      userId: data.userId,
      category: data.category,
      title: data.title,
      body: data.body,
      routeName: data.routeName ?? null,
      routeExtra: data.routeExtra ?? null,
    },
  });
  return { $id: n.id, ...n };
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  await getPrisma().notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await getPrisma().notification.updateMany({ where: { userId }, data: { isRead: true } });
}

// ── Addresses ──

export async function listAddresses(userId: string): Promise<Doc[]> {
  const rows = await getPrisma().address.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((a) => ({ $id: a.id, ...a }));
}

export async function saveAddress(
  addressId: string,
  addressUserId: string,
  data: Doc,
): Promise<Doc> {
  const clean = toUpdatable(data, [
    'label',
    'recipientName',
    'phone',
    'fullAddress',
    'details',
    'isPrimary',
  ]);
  const existing = await getPrisma().address.findUnique({ where: { id: addressId } });
  if (existing) {
    const a = await getPrisma().address.update({ where: { id: addressId }, data: clean });
    return { ...a };
  }
  const a = await getPrisma().address.create({
    data: { id: addressId, userId: addressUserId, ...(clean as any) },
  });
  return { ...a };
}

export async function deleteAddress(addressId: string): Promise<void> {
  await getPrisma().address.delete({ where: { id: addressId } });
}

// ── Payment methods ──

export async function listPaymentMethods(userId: string): Promise<Doc[]> {
  const rows = await getPrisma().paymentMethod.findMany({ where: { userId } });
  return rows.map((p) => ({ $id: p.id, ...p }));
}

export async function savePaymentMethod(methodId: string, userId: string, data: Doc): Promise<Doc> {
  const clean = toUpdatable(data, [
    'name',
    'type',
    'accountNumber',
    'balance',
    'isLinked',
    'isDefault',
  ]);
  const existing = await getPrisma().paymentMethod.findUnique({ where: { id: methodId } });
  if (existing) {
    const p = await getPrisma().paymentMethod.update({ where: { id: methodId }, data: clean });
    return { ...p };
  }
  const p = await getPrisma().paymentMethod.create({
    data: { id: methodId, userId, ...(clean as any) },
  });
  return { ...p };
}

// ── Gigs ──

export async function createGig(data: Doc): Promise<Doc> {
  const g = await getPrisma().gig.create({
    data: {
      id: (data.$id as string) || undefined,
      posterId: data.posterId as string,
      workerId: (data.workerId as string) ?? null,
      title: (data.title as string) ?? '',
      description: (data.description as string) ?? '',
      category: (data.category as any) ?? 'digital',
      location: (data.location as string) ?? null,
      budget: Number(data.budget ?? 0),
      biayaLayanan: Number(data.biayaLayanan ?? 0),
      deadline: data.deadline ? new Date(data.deadline as string) : null,
      status: (data.status as any) ?? 'open',
      escrowId: (data.escrowId as string) ?? null,
      proofImageUrl: (data.proofImageUrl as string) ?? null,
      proofNote: (data.proofNote as string) ?? null,
    },
  });
  return normalizeGig(g);
}

export async function listGigs(data: Doc): Promise<Doc[]> {
  const where: Doc = { /* ignore */ };
  if (data.category && data.category !== 'all') where.category = data.category as any;
  if (data.status && data.status !== 'all') where.status = data.status as any;
  if (data.posterId) where.posterId = data.posterId as string;
  if (data.workerId) where.workerId = data.workerId as string;
  if (data.excludePosterId) where.posterId = { not: data.excludePosterId as string };
  const rows = await getPrisma().gig.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Number(data.limit ?? 100),
  });
  return rows.map(normalizeGig);
}

export async function getGig(gigId: string): Promise<Doc | null> {
  const g = await getPrisma().gig.findUnique({ where: { id: gigId } });
  return g ? normalizeGig(g) : null;
}

export async function updateGig(gigId: string, data: Doc): Promise<Doc> {
  const allowed = toUpdatable(data, [
    'workerId',
    'title',
    'description',
    'category',
    'location',
    'budget',
    'biayaLayanan',
    'deadline',
    'status',
    'escrowId',
    'proofImageUrl',
    'proofNote',
  ]);
  const g = await getPrisma().gig.update({
    where: { id: gigId },
    data: { ...allowed, updatedAt: new Date() },
  });
  return normalizeGig(g);
}

export async function listGigReviews(gigId: string): Promise<Doc[]> {
  const rows = await getPrisma().gigReview.findMany({
    where: { gigId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((r) => ({ $id: r.id, ...r }));
}

export async function createGigReview(data: Doc): Promise<Doc> {
  const r = await getPrisma().gigReview.create({
    data: {
      gigId: data.gigId as string,
      reviewerId: data.reviewerId as string,
      rating: Number(data.rating ?? 5),
      comment: (data.comment as string) ?? null,
    },
  });
  return { $id: r.id, ...r };
}

// ── Promos ──

export async function listPromos(): Promise<Doc[]> {
  const rows = await getPrisma().promo.findMany({ where: { active: true } });
  return rows.map((p) => ({ $id: p.id, ...p }));
}

// ── Wallet / Escrow / TopUp ──

export async function getWallet(userId: string): Promise<Doc | null> {
  const w = await getPrisma().wallet.findUnique({ where: { id: userId } });
  return w ? { ...w } : null;
}

export async function ensureWallet(userId: string): Promise<Doc> {
  const existing = await getPrisma().wallet.findUnique({ where: { id: userId } });
  if (existing) return { ...existing };
  const w = await getPrisma().wallet.create({
    data: { id: userId, userId, balance: 0, totalTopUp: 0, totalSpent: 0 },
  });
  return { ...w };
}

export async function updateWallet(userId: string, data: Doc): Promise<Doc> {
  const clean = toUpdatable(data, ['balance', 'totalTopUp', 'totalSpent']);
  const w = await getPrisma().wallet.update({ where: { id: userId }, data: clean });
  return { ...w };
}

export async function createEscrow(data: Doc): Promise<Doc> {
  const e = await getPrisma().escrowTransaction.create({
    data: {
      id: (data.$id as string) || undefined,
      orderId: (data.orderId as string) ?? null,
      gigId: (data.gigId as string) ?? null,
      userId: data.userId as string,
      amount: Number(data.amount ?? 0),
      status: (data.status as any) ?? 'held',
      serviceType: (data.serviceType as string) ?? null,
      danaBelanja: Number(data.danaBelanja ?? 0),
      ongkir: Number(data.ongkir ?? 0),
      biayaLayanan: Number(data.biayaLayanan ?? 0),
    },
  });
  return { $id: e.id, ...e };
}

export async function listUserEscrows(userId: string): Promise<Doc[]> {
  const rows = await getPrisma().escrowTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((e) => ({ $id: e.id, ...e }));
}

export async function getEscrowById(escrowId: string): Promise<Doc | null> {
  const e = await getPrisma().escrowTransaction.findUnique({ where: { id: escrowId } });
  return e ? { $id: e.id, ...e } : null;
}

export async function updateEscrow(escrowId: string, data: Doc): Promise<Doc> {
  const clean = toUpdatable(data, ['status', 'releasedAt', 'amount']);
  const e = await getPrisma().escrowTransaction.update({ where: { id: escrowId }, data: clean });
  return { $id: e.id, ...e };
}

export async function createTopUp(data: Doc): Promise<Doc> {
  const t = await getPrisma().topUpTransaction.create({
    data: {
      id: (data.$id as string) || undefined,
      userId: data.userId as string,
      amount: Number(data.amount ?? 0),
      paymentMethod: (data.paymentMethod as string) ?? 'qris',
      pakasirOrderId: (data.pakasirOrderId as string) ?? null,
      status: (data.status as any) ?? 'pending',
    },
  });
  return { $id: t.id, ...t };
}

export async function listUserTopUps(userId: string): Promise<Doc[]> {
  const rows = await getPrisma().topUpTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((t) => ({ $id: t.id, ...t }));
}

export async function getTopUp(topUpId: string): Promise<Doc | null> {
  const t = await getPrisma().topUpTransaction.findUnique({ where: { id: topUpId } });
  return t ? { $id: t.id, ...t } : null;
}

export async function getTopUpByRef(refId: string): Promise<Doc | null> {
  const t = await getPrisma().topUpTransaction.findFirst({ where: { pakasirOrderId: refId } });
  return t ? { $id: t.id, ...t } : null;
}

export async function updateTopUp(topUpId: string, data: Doc): Promise<Doc> {
  const clean = toUpdatable(data, ['status', 'completedAt', 'pakasirOrderId']);
  const t = await getPrisma().topUpTransaction.update({ where: { id: topUpId }, data: clean });
  return { $id: t.id, ...t };
}

// ── Helpers ──

/** Konversi enum/model Prisma ke bentuk JSON yang konsisten seperti Appwrite doc. */
function normalizeOrder(o: any): Doc {
  const out: Doc = { ...o };
  out.id = out.id ?? o.$id;
  out.status = typeof o.status === 'string' ? o.status : o.status;
  out.orderType = typeof o.orderType === 'string' ? o.orderType : o.orderType;
  out.kebijakanLebih = typeof o.kebijakanLebih === 'string' ? o.kebijakanLebih : o.kebijakanLebih;
  // pastikan field tanggal jadi string ISO
  if (o.createdAt instanceof Date) out.createdAt = toIso(o.createdAt);
  if (o.updatedAt instanceof Date) out.updatedAt = toIso(o.updatedAt);
  return out;
}

/** Hanya izinkan field yang ada di kolom Prisma. */
function toUpdatable(data: Doc, allowed: string[]): Doc {
  const out: Doc = { /* ignore */ };
  for (const k of allowed) {
    if (data[k] !== undefined) out[k] = data[k];
  }
  return out;
}

function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Konversi Gig Prisma ke bentuk JSON (id, tanggal ISO). */
function normalizeGig(g: any): Doc {
  const out: Doc = { ...g };
  out.id = out.id ?? g.$id;
  if (g.createdAt instanceof Date) out.createdAt = toIso(g.createdAt);
  if (g.updatedAt instanceof Date) out.updatedAt = toIso(g.updatedAt);
  if (g.deadline instanceof Date) out.deadline = toIso(g.deadline);
  return out;
}

/** Konversi Jastiper Prisma ke bentuk JSON (tanggal ISO). */

/** Konversi Withdrawal Prisma ke bentuk JSON (tanggal ISO). */
function normalizeWithdrawal(w: any): Doc {
  const out: Doc = { ...w };
  out.$id = w.id;
  if (w.createdAt instanceof Date) out.createdAt = toIso(w.createdAt);
  if (w.user) {
    out.userRole = w.user.role;
    out.accountName = w.user.name;
  }
  return out;
}

// ── Admin Helper Queries ──
export async function listAllUsers(): Promise<Doc[]> {
  try {
    const rows = await getPrisma().user.findMany({ take: 100 });
    return rows.map((u: any) => ({ ...u, $id: u.id }));
  } catch {
    return [];
  }
}

export async function updateUser(id: string, data: Doc): Promise<Doc> {
  const u = await getPrisma().user.update({ where: { id }, data });
  return { ...u, $id: u.id };
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await getPrisma().user.delete({ where: { id } });
  } catch { /* ignore */ }
}

export async function listAllOrders(): Promise<Doc[]> {
  try {
    const rows = await getPrisma().order.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return rows.map(normalizeOrder);
  } catch {
    return [];
  }
}

export async function deleteOrder(id: string): Promise<void> {
  try {
    await getPrisma().order.delete({ where: { id } });
  } catch { /* ignore */ }
}

export async function listAllGigs(): Promise<Doc[]> {
  try {
    const rows = await getPrisma().gig.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return rows.map(normalizeGig);
  } catch {
    return [];
  }
}

export async function deleteGig(id: string): Promise<void> {
  try {
    await getPrisma().gig.delete({ where: { id } });
  } catch { /* ignore */ }
}

export async function listAllJastipers(): Promise<Doc[]> {
  try {
    const rows = await getPrisma().jastiper.findMany({ take: 100 });
    return rows.map(normalizeJastiper);
  } catch {
    return [];
  }
}

export async function deleteJastiper(id: string): Promise<void> {
  try {
    await getPrisma().jastiper.delete({ where: { id } });
  } catch { /* ignore */ }
}

export async function listAllWithdrawals(): Promise<Doc[]> {
  try {
    const rows = await getPrisma().withdrawal.findMany({
      include: { user: { select: { role: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map(normalizeWithdrawal);
  } catch {
    return [];
  }
}

export async function updateWithdrawalStatus(id: string, status: string): Promise<Doc | null> {
  try {
    const w = await getPrisma().withdrawal.update({
      where: { id },
      data: { status: status as any },
    });
    return normalizeWithdrawal(w);
  } catch {
    return null;
  }
}

export async function deleteWithdrawal(id: string): Promise<void> {
  try {
    await getPrisma().withdrawal.delete({ where: { id } });
  } catch { /* ignore */ }
}

// ── Jastipers (PostgreSQL real implementation) ──
// ── Promos ──
export async function createPromo(data: any): Promise<Doc> {
  const p = await getPrisma().promo.create({
    data: {
      badge: data.badge || 'PROMO',
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      code: data.code,
      period: data.period,
      type: data.type || 'discount',
      category: data.category || 'all',
      minTransaction: data.minTransaction ? Number(data.minTransaction) : 0,
      discountPercent: data.discountPercent ? Number(data.discountPercent) : null,
      discountFlat: data.discountFlat ? Number(data.discountFlat) : null,
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      quota: data.quota ? Number(data.quota) : null,
      budgetMax: data.budgetMax ? Number(data.budgetMax) : null,
      targetUsers: data.targetUsers || 'all',
      isNewUserOnly: data.isNewUserOnly ?? false,
      imageUrl: data.imageUrl,
      gradient: data.gradient,
      accent: data.accent,
      active: data.active ?? true,
    },
  });
  return { ...p, $id: p.id, createdAt: p.createdAt.toISOString() };
}

export async function listAllPromos(): Promise<Doc[]> {
  try {
    const rows = await getPrisma().promo.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((p: any) => ({ ...p, $id: p.id, createdAt: p.createdAt.toISOString() }));
  } catch {
    return [];
  }
}

export async function deletePromo(id: string): Promise<void> {
  try {
    await getPrisma().promo.delete({ where: { id } });
  } catch { /* ignore */ }
}

function normalizeJastipProduct(p: any): Doc {
  const out: Doc = { ...p };
  out.id = out.id ?? p.$id;
  if (p.createdAt instanceof Date) out.createdAt = toIso(p.createdAt);
  if (p.updatedAt instanceof Date) out.updatedAt = toIso(p.updatedAt);
  return out;
}

export async function listJastipers(filter?: {
  search?: string;
  area?: string;
  lat?: number;
  lng?: number;
  sort?: string;
}): Promise<Doc[]> {
  try {
    const where: any = { isJastipActive: true };
    if (filter?.area) where.area = { contains: filter.area, mode: 'insensitive' };
    const rows = await getPrisma().jastiper.findMany({
      where,
      include: { products: { where: { published: true }, orderBy: { createdAt: 'desc' } } },
      orderBy: filter?.sort === 'rating' ? { rating: 'desc' } : { createdAt: 'desc' },
      take: 50,
    });
    let result = rows.map(normalizeJastiper);
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (j) =>
          (j.name || '').toLowerCase().includes(q) ||
          (j.area || '').toLowerCase().includes(q) ||
          (j.openTripTitle || '').toLowerCase().includes(q),
      );
    }
    return result;
  } catch {
    // Fallback: jika table belum ada (sebelum migrate)
    return [];
  }
}

function normalizeJastiper(c: any): any {
  if (!c) return c;
  return { ...c, jastiperId: c.id };
}

export async function getJastiper(id: string): Promise<any | null> {
  try {
    const j = await getPrisma().jastiper.findUnique({
      where: { id },
      include: { products: { where: { published: true } } },
    });
    return j ? normalizeJastiper(j) : null;
  } catch {
    return null;
  }
}

export async function upsertJastiper(id: string, data: any): Promise<any> {
  const allowedFields = [
    'name',
    'email',
    'phone',
    'photoUrl',
    'coverUrl',
    'bio',
    'vehicleType',
    'vehiclePlate',
    'selectedArea',
    'category',
    'feeEstimate',
    'flatOngkir',
    'isOnline',
    'isActive',
    'isJastipActive',
    'kycVerified',
    'kycKtpUrl',
    'kycSelfieUrl',
    'verified',
    'rating',
    'totalOrders',
    'openTripTitle',
    'openTripDestination',
    'openTripSchedule',
    'openTripClosing',
  ];
  const updateData: any = { /* ignore */ };
  for (const k of allowedFields) {
    if (data[k] !== undefined) updateData[k] = data[k];
  }

  const existing = await getPrisma().jastiper.findUnique({ where: { id } });
  let j;
  if (existing) {
    j = await getPrisma().jastiper.update({
      where: { id },
      data: updateData,
      include: { products: true },
    });
  } else {
    j = await getPrisma().jastiper.create({
      data: { id, name: data.name || 'Jastiper Truzzi', ...updateData },
      include: { products: true },
    });
  }
  return normalizeJastiper(j);
}

export async function updateJastiper(id: string, data: any): Promise<any> {
  const allowedFields = [
    'name',
    'email',
    'phone',
    'photoUrl',
    'coverUrl',
    'bio',
    'vehicleType',
    'vehiclePlate',
    'selectedArea',
    'category',
    'feeEstimate',
    'flatOngkir',
    'isOnline',
    'isActive',
    'isJastipActive',
    'kycVerified',
    'kycKtpUrl',
    'kycSelfieUrl',
    'verified',
    'rating',
    'totalOrders',
    'openTripTitle',
    'openTripDestination',
    'openTripSchedule',
    'openTripClosing',
  ];
  const updateData: any = { /* ignore */ };
  for (const k of allowedFields) {
    if (data[k] !== undefined) updateData[k] = data[k];
  }
  const j = await getPrisma().jastiper.update({
    where: { id },
    data: updateData,
    include: { products: true },
  });
  return normalizeJastiper(j);
}

// ── Favorites ──

export async function listFavorites(userId: string): Promise<Doc[]> {
  try {
    const favs = await getPrisma().favorite.findMany({
      where: { userId },
      include: { jastiper: { include: { products: { where: { published: true }, take: 3 } } } },
      orderBy: { createdAt: 'desc' },
    });
    return favs.map((f) => ({
      ...f,
      id: f.id,
      jastiper: f.jastiper ? normalizeJastiper(f.jastiper) : null,
    }));
  } catch {
    return [];
  }
}

export async function addFavorite(userId: string, jastiperId: string): Promise<Doc> {
  const fav = await getPrisma().favorite.upsert({
    where: { userId_jastiperId: { userId, jastiperId } },
    create: { userId, jastiperId },
    update: { /* ignore */ },
  });
  return { ...fav, id: fav.id };
}

export async function removeFavorite(userId: string, jastiperIdOrFavId: string): Promise<void> {
  try {
    // Try by id first, then by jastiperId
    await getPrisma().favorite.deleteMany({
      where: {
        userId,
        OR: [{ id: jastiperIdOrFavId }, { jastiperId: jastiperIdOrFavId }],
      },
    });
  } catch {
    /* ok */
  }
}

export async function checkFavorite(userId: string, jastiperId: string): Promise<boolean> {
  try {
    const fav = await getPrisma().favorite.findUnique({
      where: { userId_jastiperId: { userId, jastiperId } },
    });
    return !!fav;
  } catch {
    return false;
  }
}

// ── Jastip Products (PostgreSQL) ──

export async function listJastipProducts(jastiperId: string): Promise<Doc[]> {
  try {
    const rows = await getPrisma().jastipProduct.findMany({
      where: { id: jastiperId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(normalizeJastipProduct);
  } catch {
    return [];
  }
}

export async function listMyJastipProducts(jastiperId: string): Promise<Doc[]> {
  try {
    const jastiper = await getPrisma().jastiper.findUnique({ where: { id: jastiperId } });
    if (!jastiper) return [];
    const rows = await getPrisma().jastipProduct.findMany({
      where: { jastiperId: jastiper.id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(normalizeJastipProduct);
  } catch {
    return [];
  }
}

export async function createJastipProduct(data: Doc): Promise<Doc> {
  const p = await getPrisma().jastipProduct.create({
    data: {
      jastiperId: data.jastiperId as string,
      title: data.title as string,
      description: (data.description as string) ?? null,
      price: Number(data.price ?? 0),
      category: (data.category as string) ?? null,
      images: (data.images as string[]) ?? [],
      published: Boolean(data.published ?? true),
      status: (data.status as any) ?? 'active',
    },
  });
  return normalizeJastipProduct(p);
}

export async function updateJastipProduct(id: string, data: Doc): Promise<Doc> {
  const allowed = ['title', 'description', 'price', 'category', 'images', 'published', 'status'];
  const updateData: any = { /* ignore */ };
  for (const k of allowed) {
    if (data[k] !== undefined) updateData[k] = data[k];
  }
  const p = await getPrisma().jastipProduct.update({ where: { id }, data: updateData });
  return normalizeJastipProduct(p);
}

export async function deleteJastipProduct(id: string): Promise<void> {
  await getPrisma().jastipProduct.delete({ where: { id } });
}

export async function togglePublishJastipProduct(id: string): Promise<Doc> {
  const cur = await getPrisma().jastipProduct.findUnique({ where: { id } });
  if (!cur) throw new Error('Produk tidak ditemukan');
  const p = await getPrisma().jastipProduct.update({
    where: { id },
    data: { published: !cur.published },
  });
  return normalizeJastipProduct(p);
}

export const createOrderReport = async (data: Doc): Promise<Doc> => ({
  ...data,
  id: 'mock-report',
});
export const createOrderReview = async (data: Doc): Promise<Doc> => ({
  ...data,
  id: 'mock-review',
});
export const getOrderReviews = async (_orderId: string): Promise<Doc[]> => [];


