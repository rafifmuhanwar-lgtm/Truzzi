import { Router, type Request, type Response, type NextFunction } from 'express';
import { config } from '../config.js';
import { getUser, requireUser, readSessionToken, verifySession } from '../services/session.js';
import * as db from '../services/data.js';
import { autoReplyCS } from '../services/auto-reply.js';
import { createNotification } from '../services/data.js';

import { getPrisma } from '../services/prisma-client.js';

function getUnifiedRoomId(userA: string, userB: string) {
  return userA < userB ? `room_${userA}_${userB}` : `room_${userB}_${userA}`;
}

function getCookieName(app?: string): string {
  if (app === 'driver') return config.session.cookieNameDriver;
  if (app === 'customer') return config.session.cookieNameCustomer;
  return config.session.cookieName;
}

function detectApp(req: Request): string | undefined {
  const appHeader = req.headers['x-app'];
  if (appHeader === 'driver') return 'driver';
  if (appHeader === 'customer') return 'customer';
  const origin = req.headers.origin ?? '';
  if (origin.includes(':5174') || origin.includes('driver')) return 'driver';
  if (origin.includes(':5173') || origin.includes('customer')) return 'customer';
  return undefined;
}

const router = Router();

// Middleware to attach user from app-specific cookie
router.use((req: Request, _res: Response, next: NextFunction) => {
  const app = detectApp(req);
  const cookieName = getCookieName(app);
  const token = readSessionToken(req, cookieName);
  const user = token ? verifySession(token) : null;
  if (user) {
    (req as Request & { user?: typeof user }).user = user;
  }
  next();
});

/** Bentuk daftar chat room dari order aktif + room CS — mengikuti chat_repository.dart.
 *  Untuk kurir (role jastiper): room turunan dari order milik kurir, lawan bicara = customer. */
async function buildRooms(userId: string, role?: string): Promise<Record<string, unknown>[]> {
  const isJastiper = role === 'jastiper';
  const orders = isJastiper ? await db.listJastiperOrders(userId) : await db.listOrders(userId);
  const roomsMap = new Map<string, Record<string, unknown>>();

  // CS Room
  roomsMap.set('room_cs', {
    id: isJastiper ? `cs_chat_${userId}` : 'room_cs',
    senderName: 'Customer Service Truzzi',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    lastMessage: 'Halo! Ada yang bisa kami bantu?',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 0,
    isOnline: true,
    lastSeenText: 'Aktif 24 Jam',
    serviceType: 'Bantuan & Kendala',
    isSupport: true,
    orderStatus: 'ongoing',
    orderUpdatedAt: null,
  });

  const THREE_HOURS = 3 * 60 * 60 * 1000;

  // Populate from active orders
  for (const order of orders) {
    const jastiperId = order.jastiperId ?? '';
    if (!jastiperId) continue;

    const status = order.status ?? 'ongoing';
    const updated = order.updatedAt ?? order.createdAt;

    if (status !== 'ongoing' && status !== 'completed') continue;
    if (status === 'completed') {
      const age = Date.now() - Date.parse(updated ?? new Date().toISOString());
      if (!(age >= 0 && age < THREE_HOURS)) continue;
    }

    const targetUserId = isJastiper ? order.userId : jastiperId;
    const roomId = getUnifiedRoomId(userId, targetUserId);

    let avatar = '';
    let senderName = '';
    if (isJastiper) {
      const customer = await db.getUserDoc(order.userId);
      avatar = customer?.photoUrl || '';
      senderName = customer?.name
        ? `${customer.name}`
        : `Customer #${String(order.userId).slice(0, 6).toUpperCase()}`;
    } else {
      if (jastiperId) {
        const jastiper = await db.getJastiper(jastiperId);
        if (jastiper?.photoUrl) avatar = jastiper.photoUrl;
      }
      if (!avatar) avatar = order.jastiperAvatar ?? '';
      senderName = order.jastiperName ? `${order.jastiperName}` : 'Jastiper Truzzi';
    }

    roomsMap.set(roomId, {
      id: roomId, // unified room ID
      recipientId: targetUserId,
      senderName,
      avatarUrl: avatar,
      lastMessage: order.description || order.title || 'Tap untuk mulai chat',
      lastMessageTime: order.updatedAt ?? order.createdAt,
      unreadCount: 0,
      isOnline: isJastiper ? true : !!order.jastiperName,
      lastSeenText: isJastiper ? 'Customer' : order.jastiperName ? 'Jastiper' : 'Menunggu Jastiper',
      serviceType: 'Jastip',
      isSupport: false,
      orderStatus: status,
      orderUpdatedAt: order.updatedAt ?? order.createdAt ?? null,
      orderTitle: order.title ?? '',
      activeOrderId: order.id,
      lastMessageSenderId: '', // Default for active orders since we don't query messages here
    });
  }

  let searchId = userId;
  if (isJastiper) {
    const jRow = await getPrisma()
      .jastiper.findUnique({ where: { id: userId } })
      .catch(() => null);
    if (jRow) searchId = jRow.id;
  }

  // Fetch all chat messages that contain the searchId in the orderId to find pre-order chats
  const unifiedMessages = await getPrisma().chatMessage.findMany({
    where: {
      orderId: { contains: searchId },
    },
    orderBy: { timestamp: 'desc' },
  });

  for (const msg of unifiedMessages) {
    const roomId = msg.orderId;
    if (!roomId.startsWith('room_')) continue; // Skip non-unified room IDs
    // The format is `room_${userA}_${userB}`. Since user IDs might contain underscores (e.g. `usr_123`), we should extract them differently.
    const rest = roomId.substring(5); // remove 'room_'

    // We know searchId is one of the users. Let's find out which one.
    let targetUserId = '';
    if (rest.startsWith(searchId + '_')) {
      targetUserId = rest.substring(searchId.length + 1);
    } else if (rest.endsWith('_' + searchId)) {
      targetUserId = rest.substring(0, rest.length - searchId.length - 1);
    } else {
      continue;
    }

    if (targetUserId === searchId) continue;

    if (!roomsMap.has(roomId)) {
      // Build a room entry for this pre-order chat
      let avatar = '';
      let senderName = 'Pengguna';
      let serviceType = 'Chat';
      let isOnline = false;

      if (isJastiper) {
        const customer = await db.getUserDoc(targetUserId);
        avatar = customer?.photoUrl || '';
        senderName = customer?.name ? `${customer.name}` : 'Customer';
      } else {
        const jastiper = await db.getJastiper(targetUserId);
        if (jastiper) {
          avatar = jastiper.photoUrl || '';
          senderName = jastiper.name;
          isOnline = jastiper.isOnline;
          serviceType = 'Jastiper';
        } else {
          const other = await db.getUserDoc(targetUserId);
          avatar = other?.photoUrl || '';
          senderName = other?.name || 'Pengguna';
        }
      }

      roomsMap.set(roomId, {
        id: roomId,
        recipientId: targetUserId,
        senderName,
        avatarUrl: avatar,
        lastMessage: msg.message || 'Pesan Baru',
        lastMessageTime: msg.timestamp.toISOString(),
        unreadCount: 0,
        isOnline,
        lastSeenText: 'Aktif',
        serviceType,
        isSupport: false,
        orderStatus: 'pre-order',
        orderUpdatedAt: msg.timestamp.toISOString(),
        orderTitle: 'Diskusi dengan Jastiper',
        lastMessageSenderId: msg.senderId,
      });
    } else {
      // Room already exists (e.g. from active order). Just update the last message if this msg is newer.
      const room = roomsMap.get(roomId) as any;
      const tRoom = new Date(String(room.lastMessageTime || 0)).getTime();
      const tMsg = new Date(msg.timestamp).getTime();
      if (tMsg > tRoom) {
        room.lastMessage = msg.message || 'Pesan Baru';
        room.lastMessageTime = msg.timestamp.toISOString();
        room.lastMessageSenderId = msg.senderId;
      }
    }
  }

  // Fetch unread count map
  const unreads = await getPrisma().chatMessage.groupBy({
    by: ['orderId'],
    _count: {
      id: true,
    },
    where: {
      isRead: false,
      senderId: { not: searchId },
    },
  });
  const unreadMap = new Map(unreads.map((u) => [u.orderId, u._count.id]));

  for (const room of roomsMap.values()) {
    room.unreadCount = unreadMap.get(room.id as string) || 0;
  }

  // Sort by lastMessageTime descending
  return Array.from(roomsMap.values()).sort((a, b) => {
    return (
      new Date(String(b.lastMessageTime)).getTime() - new Date(String(a.lastMessageTime)).getTime()
    );
  });
}

// GET /api/chat/rooms?userId=
router.get('/rooms', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const rooms = await buildRooms(user.id, user.role);
  res.json({ rooms });
});

// POST /api/chat/rooms/:roomId/read
router.post('/rooms/:roomId/read', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const roomId = req.params.roomId;

  let searchId = user.id;
  if (user.role === 'jastiper') {
    const jRow = await getPrisma()
      .jastiper.findUnique({ where: { id: user.id } })
      .catch(() => null);
    if (jRow) searchId = jRow.id;
  }

  await getPrisma().chatMessage.updateMany({
    where: {
      orderId: roomId,
      isRead: false,
      senderId: { not: searchId },
    },
    data: {
      isRead: true,
    },
  });

  res.json({ success: true });
});

// GET /api/chat/rooms/:roomId/messages
router.get('/rooms/:roomId/messages', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const roomId = req.params.roomId;

  // Room CS customer ('room_cs') & CS kurir ('cs_chat_{id}') — seeded greeting, tidak dipersist.
  if (roomId === 'room_cs' || roomId === `cs_chat_${user.id}`) {
    const seeded: Record<string, unknown>[] = [
      {
        id: 'msg_cs_1',
        roomId,
        text: `Halo ${user.name || 'Pelanggan'}! Ada yang bisa kami bantu seputar pesanan atau aplikasi Truzzi?`,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        isMine: false,
        status: 'delivered',
        senderRole: 'support',
        messageType: 'text',
        mediaUrl: null,
      },
    ];
    return res.json({ messages: seeded });
  }

  let messages = await db.listChatMessages(roomId);

  // Jika tidak ketemu dan roomId BUKAN room_ unified, coba cari unified room-nya
  if (messages.length === 0 && !roomId.startsWith('room_') && roomId !== 'room_cs') {
    // cek apakah ada order dengan ID ini
    try {
      const order = await db.getOrder(roomId);
      if (order && order.jastiperId) {
        const unifiedId = getUnifiedRoomId(order.userId, order.jastiperId);
        const unifiedMsgs = await db.listChatMessages(unifiedId);
        if (unifiedMsgs.length > 0) messages = unifiedMsgs;
      }
    } catch { /* ignore */ }
  }

  const normalized = messages.map((m) => ({
    id: m.$id ?? m.id,
    roomId: m.orderId ?? roomId,
    text: m.message ?? m.text ?? '',
    timestamp: m.timestamp ?? new Date().toISOString(),
    isMine: m.senderId === user.id,
    status: 'read',
    senderRole: m.senderRole ?? '',
    senderId: m.senderId ?? '',
    senderName: m.senderName ?? '',
    messageType: m.messageType ?? 'text',
    mediaUrl: m.mediaUrl ?? null,
  }));
  res.json({ messages: normalized });
});

// POST /api/chat/rooms/:roomId/messages {text, messageType, mediaUrl, senderRole}
router.post('/rooms/:roomId/messages', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const roomId = req.params.roomId;
    const isJastiper = user.role === 'jastiper';
    const defaultRole = isJastiper ? 'jastiper' : 'customer';
    const { text, messageType = 'text', mediaUrl, senderRole = defaultRole } = req.body ?? { /* ignore */ };

    // Room CS (customer & kurir) tidak dipersist di Appwrite asli — balas dengan bot
    if (roomId === 'room_cs' || roomId === `cs_chat_${user.id}`) {
      const msg: Record<string, unknown> = {
        id: `msg_${Date.now()}`,
        roomId,
        text: text ?? '',
        timestamp: new Date().toISOString(),
        isMine: true,
        status: 'delivered',
        senderRole,
        messageType,
        mediaUrl: mediaUrl ?? null,
        senderId: user.id,
        senderName: user.name,
      };
      // delay seperti di Flutter
      setTimeout(() => {
        /* balasan bot di-hijack route GET agar mudah di-poll */
      }, 1500);
      return res.status(201).json({ message: msg, botReplyPending: true });
    }

    const doc = await db.createChatMessage({
      orderId: roomId,
      senderId: user.id,
      senderName: user.name || (isJastiper ? 'Kurir' : 'Customer'),
      senderRole: senderRole || defaultRole,
      message: text ?? '',
      mediaUrl: mediaUrl ?? '',
      messageType: messageType || 'text',
      timestamp: new Date().toISOString(),
    });

    // Notify recipient if roomId is unified (room_userA_userB) or valid order
    let targetUserId = '';
    if (roomId.startsWith('room_')) {
      const rest = roomId.substring(5);
      // user.id could be the sender or the jastiper, but wait!
      // In router.post, we don't know the searchId of the OTHER person exactly.
      // But we know OUR user.id. We can extract targetUserId.
      if (rest.startsWith(user.id + '_')) {
        targetUserId = rest.substring(user.id.length + 1);
      } else if (rest.endsWith('_' + user.id)) {
        targetUserId = rest.substring(0, rest.length - user.id.length - 1);
      } else {
        // If the sender is a Jastiper, user.id is their User.id, but the room ID uses Jastiper.id!
        // We need to resolve their Jastiper ID to parse it correctly if they are a Jastiper.
        if (isJastiper) {
          const jRow = await getPrisma()
            .jastiper.findUnique({ where: { id: user.id } })
            .catch(() => null);
          if (jRow) {
            const jId = jRow.id;
            if (rest.startsWith(jId + '_')) {
              targetUserId = rest.substring(jId.length + 1);
            } else if (rest.endsWith('_' + jId)) {
              targetUserId = rest.substring(0, rest.length - jId.length - 1);
            }
          }
        }
      }
    } else {
      const order = await db.getOrder(roomId).catch(() => null);
      if (order) {
        targetUserId = isJastiper ? order.userId : order.jastiperId || '';
      }
    }

    if (targetUserId) {
      // Ensure targetUserId is a User.id, not a Jastiper.id
      let finalUserId = targetUserId;
      try {
        const jastiper = await getPrisma()
          .jastiper.findUnique({ where: { id: targetUserId } })
          .catch(() => null);
        if (jastiper) {
          finalUserId = jastiper.id;
        }
      } catch {
        /* ignore */
      }

      await createNotification({
        userId: finalUserId,
        category: 'Chat',
        title: `Pesan baru dari ${user.name || 'Jastiper'}`,
        body: String(text || 'Mengirim media').substring(0, 50),
        routeName: '/chat/room',
        routeExtra: roomId,
      }).catch(() => { /* ignore */ });
    }

    const msg = {
      id: doc.$id ?? doc.id,
      roomId,
      text: text ?? '',
      timestamp: new Date().toISOString(),
      isMine: true,
      status: 'delivered',
      senderRole: senderRole || defaultRole,
      messageType: messageType || 'text',
      mediaUrl: mediaUrl ?? null,
      senderId: user.id,
      senderName: user.name,
    };
    res.status(201).json({ message: msg });
  } catch {
    console.error(e);
    res.status(400).json({ message: 'Gagal mengirim pesan' });
  }
});

// POST /api/chat/rooms/:roomId/read
router.post('/rooms/:roomId/read', requireUser, (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// POST /api/chat/cs/bot-reply — dipanggil frontend untuk mendapat balasan bot CS
router.post('/cs/bot-reply', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const isJastiper = user.role === 'jastiper';
    const csRoomId = isJastiper ? `cs_chat_${user.id}` : 'room_cs';
    const { text } = req.body ?? { /* ignore */ };
    const replyText = autoReplyCS(String(text ?? ''));
    await createNotification({
      userId: user.id,
      category: 'Pesanan',
      title: 'Pesan Baru 💬',
      body: replyText.length > 100 ? replyText.slice(0, 100) + '...' : replyText,
      routeName: '/chat/room',
      routeExtra: csRoomId,
    });
    res.json({
      message: {
        id: `cs_reply_${Date.now()}`,
        roomId: csRoomId,
        text: replyText,
        timestamp: new Date().toISOString(),
        isMine: false,
        status: 'delivered',
        senderRole: 'support',
        messageType: 'text',
        mediaUrl: null,
      },
    });
  } catch {
    console.error(e);
    res.status(400).json({ message: 'Gagal membalas' });
  }
});

export default router;



