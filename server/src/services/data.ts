import * as postgres from './prisma-db.js';

export const getUserDoc = (userId: string) => postgres.getUserDoc(userId);
export const upsertUserDoc = (user: any) => postgres.upsertUserDoc(user);
export const updateUserDoc = (userId: string, data: any) => postgres.updateUserDoc(userId, data);
export const createOrder = (data: any) => postgres.createOrder(data);
export const listOrders = (userId: string) => postgres.listOrders(userId);
export const getOrder = (orderId: string) => postgres.getOrder(orderId);
export const updateOrder = (orderId: string, data: any) => postgres.updateOrder(orderId, data);

export const updateJastiper = (jastiperId: string, data: any) =>
  postgres.updateJastiper(jastiperId, data);
export const listAvailableOrders = () => postgres.listAvailableOrders();
export const listJastiperOrders = (jastiperId: string) => postgres.listJastiperOrders(jastiperId);
export const acceptOrder = (orderId: string, patch: any) => postgres.acceptOrder(orderId, patch);
export const createWithdrawal = (data: any) => postgres.createWithdrawal(data);
export const listWithdrawalsByUser = (userId: string) => postgres.listWithdrawalsByUser(userId);
export const listChatMessages = (orderId: string) => postgres.listChatMessages(orderId);
export const listAllChatMessages = () => postgres.listAllChatMessages();
export const createChatMessage = (data: any) => postgres.createChatMessage(data);
export const listNotifications = (userId: string) => postgres.listNotifications(userId);
export const createNotification = (data: any) => postgres.createNotification(data);
export const markNotificationRead = (notificationId: string, userId: string) =>
  postgres.markNotificationRead(notificationId, userId);
export const markAllNotificationsRead = (userId: string) =>
  postgres.markAllNotificationsRead(userId);
export const listAddresses = (userId: string) => postgres.listAddresses(userId);
export const saveAddress = (addressId: string, addressUserId: string, data: any) =>
  postgres.saveAddress(addressId, addressUserId, data);
export const deleteAddress = (addressId: string) => postgres.deleteAddress(addressId);
export const listPaymentMethods = (userId: string) => postgres.listPaymentMethods(userId);
export const savePaymentMethod = (methodId: string, userId: string, data: any) =>
  postgres.savePaymentMethod(methodId, userId, data);
export const createGig = (data: any) => postgres.createGig(data);
export const listGigs = (data: any) => postgres.listGigs(data);
export const getGig = (gigId: string) => postgres.getGig(gigId);
export const updateGig = (gigId: string, data: any) => postgres.updateGig(gigId, data);
export const listGigReviews = (gigId: string) => postgres.listGigReviews(gigId);
export const createGigReview = (data: any) => postgres.createGigReview(data);
export const listPromos = () => postgres.listPromos();
export const getWallet = (userId: string) => postgres.getWallet(userId);
export const ensureWallet = (userId: string) => postgres.ensureWallet(userId);
export const updateWallet = (userId: string, data: any) => postgres.updateWallet(userId, data);
export const createEscrow = (data: any) => postgres.createEscrow(data);
export const listUserEscrows = (userId: string) => postgres.listUserEscrows(userId);
export const getEscrowById = (escrowId: string) => postgres.getEscrowById(escrowId);
export const updateEscrow = (escrowId: string, data: any) => postgres.updateEscrow(escrowId, data);
export const createTopUp = (data: any) => postgres.createTopUp(data);
export const listUserTopUps = (userId: string) => postgres.listUserTopUps(userId);
export const getTopUp = (topUpId: string) => postgres.getTopUp(topUpId);
export const getTopUpByRef = (refId: string) => postgres.getTopUpByRef(refId);
export const updateTopUp = (topUpId: string, data: any) => postgres.updateTopUp(topUpId, data);
export const listAllUsers = () => postgres.listAllUsers();
export const updateUser = (id: string, data: any) => postgres.updateUser(id, data);
export const deleteUser = (id: string) => postgres.deleteUser(id);
export const listAllOrders = () => postgres.listAllOrders();
export const deleteOrder = (id: string) => postgres.deleteOrder(id);
export const listAllGigs = () => postgres.listAllGigs();
export const deleteGig = (id: string) => postgres.deleteGig(id);
export const listAllJastipers = () => postgres.listAllJastipers();
export const deleteJastiper = (id: string) => postgres.deleteJastiper(id);
export const listAllWithdrawals = () => postgres.listAllWithdrawals();
export const updateWithdrawalStatus = (id: string, status: string) =>
  postgres.updateWithdrawalStatus(id, status);
export const deleteWithdrawal = (id: string) => postgres.deleteWithdrawal(id);

export const createPromo = (data: any) => postgres.createPromo(data);
export const listAllPromos = () => postgres.listAllPromos();
export const deletePromo = (id: string) => postgres.deletePromo(id);
export const listJastipers = (filter?: any) => postgres.listJastipers(filter);
export const getJastiper = (id: string) => postgres.getJastiper(id);
export const upsertJastiper = (jastiperId: string, data: any) =>
  postgres.upsertJastiper(jastiperId, data);
export const listFavorites = (userId: string) => postgres.listFavorites(userId);
export const addFavorite = (userId: string, jastiperId: string) =>
  postgres.addFavorite(userId, jastiperId);
export const removeFavorite = (userId: string, jastiperIdOrFavId: string) =>
  postgres.removeFavorite(userId, jastiperIdOrFavId);
export const checkFavorite = (userId: string, jastiperId: string) =>
  postgres.checkFavorite(userId, jastiperId);
export const listJastipProducts = (jastiperId: string) => postgres.listJastipProducts(jastiperId);
export const listMyJastipProducts = (jastiperId: string) =>
  postgres.listMyJastipProducts(jastiperId);
export const createJastipProduct = (data: any) => postgres.createJastipProduct(data);
export const updateJastipProduct = (id: string, data: any) =>
  postgres.updateJastipProduct(id, data);
export const deleteJastipProduct = (id: string) => postgres.deleteJastipProduct(id);
export const togglePublishJastipProduct = (id: string) => postgres.togglePublishJastipProduct(id);
export const createOrderReport = (data: any) => postgres.createOrderReport(data);
export const createOrderReview = (data: any) => postgres.createOrderReview(data);
export const getOrderReviews = (orderId: string) => postgres.getOrderReviews(orderId);

