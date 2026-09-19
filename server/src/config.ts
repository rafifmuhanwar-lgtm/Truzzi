import 'dotenv/config';

export const config = {
  appwrite: {
    endpoint: process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
    projectId: process.env.APPWRITE_PROJECT_ID || '6a5a2ab80012a3e5860a',
    apiKey: process.env.APPWRITE_API_KEY || '',
    databaseId: process.env.APPWRITE_DATABASE_ID || '6a5a2cca002aaa8dd6f8',
    storageBucketId: process.env.APPWRITE_STORAGE_BUCKET_ID || '6a5d565700192c93077a',
    collections: {
      users: process.env.APPWRITE_USERS_COLLECTION || 'users',
      orders: process.env.APPWRITE_ORDERS_COLLECTION || 'orders',
      chats: process.env.APPWRITE_CHATS_COLLECTION || 'chats',
      jastipers: process.env.APPWRITE_JASTIPERS_COLLECTION || 'jastipers',
      notifications: process.env.APPWRITE_NOTIFICATIONS_COLLECTION || 'notifications',
      addresses: process.env.APPWRITE_ADDRESSES_COLLECTION || 'addresses',
      paymentMethods: process.env.APPWRITE_PAYMENT_METHODS_COLLECTION || 'payment_methods',
      promos: process.env.APPWRITE_PROMOS_COLLECTION || 'promos',
      wallets: process.env.APPWRITE_WALLETS_COLLECTION || 'truzzipay_wallets',
      escrows: process.env.APPWRITE_ESCROWS_COLLECTION || 'escrow_transactions',
      topups: process.env.APPWRITE_TOPUPS_COLLECTION || 'topup_transactions',
      gigs: process.env.APPWRITE_GIGS_COLLECTION || 'gigs',
      gigReviews: process.env.APPWRITE_GIG_REVIEWS_COLLECTION || 'gig_reviews',
    },
    oauth: {
      successRedirect: process.env.APPWRITE_OAUTH_SUCCESS_REDIRECT || '',
      failureRedirect: process.env.APPWRITE_OAUTH_FAILURE_REDIRECT || '',
    },
  },
  session: {
    jwtSecret: process.env.JWT_SECRET || 'truzzi-dev-secret-change-me',
    cookieName: process.env.SESSION_COOKIE_NAME || 'sg_session',
    // Separate cookies for driver & customer apps to allow concurrent logins
    cookieNameDriver: process.env.SESSION_COOKIE_NAME_DRIVER || 'sg_session_driver',
    cookieNameCustomer: process.env.SESSION_COOKIE_NAME_CUSTOMER || 'sg_session_customer',
  },
  payment: {
    // Gateway aktif: 'buatqris' | 'pakasir' | 'demo'
    provider: (process.env.PAYMENT_PROVIDER || 'buatqris') as 'buatqris' | 'pakasir' | 'demo',
  },
  buatqris: {
    baseUrl: process.env.BUATQRIS_BASE_URL || 'https://api.buatqris.site',
    appBaseUrl: process.env.BUATQRIS_APP_BASE_URL || 'https://app.buatqris.site',
    accountId: process.env.BUATQRIS_ACCOUNT_ID || '',
    secretToken: process.env.BUATQRIS_SECRET_TOKEN || '',
    signingSecret: process.env.BUATQRIS_SIGNING_SECRET || '',
    // Mode sandbox: test=1 saat create, tombol 'Saya Sudah Bayar' memakai test_pay.
    sandbox: process.env.BUATQRIS_SANDBOX !== '0',
  },
  pakasir: {
    baseUrl: process.env.PAKASIR_BASE_URL || 'https://app.pakasir.com',
    projectSlug: process.env.PAKASIR_PROJECT_SLUG || 'truzzi',
    apiKey: process.env.PAKASIR_API_KEY || '',
  },
  mapbox: {
    accessToken: process.env.MAPBOX_ACCESS_TOKEN || '',
  },
  server: {
    port: Number(process.env.PORT || 4000),
    // Bisa beberapa origin dipisah koma (customer :5173 + driver :5174).
    webOrigins: (
      process.env.WEB_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175'
    )
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  data: {
    // 'postgres' (default) | 'appwrite' | 'demo'
    engine: (process.env.DATA_ENGINE || 'postgres') as 'postgres' | 'appwrite' | 'demo',
    databaseUrl: process.env.DATABASE_URL || '',
  },
  demo: {
    // Demo aktif bila engine=demo, atau (Appwrite dipilih tapi tidak ada API key).
    enabled:
      process.env.DATA_ENGINE === 'demo' ||
      (!process.env.DATA_ENGINE && !process.env.APPWRITE_API_KEY),
  },
  storage: {
    // 'local' (folder) | 'appwrite'
    engine: (process.env.STORAGE_ENGINE || 'local') as 'local' | 'appwrite',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },
};

/** True when the proxy talks to real Appwrite (engine appwrite AND a server key exists). */
export function canUseAppwrite(): boolean {
  return config.data.engine === 'appwrite' && !!config.appwrite.apiKey;
}
