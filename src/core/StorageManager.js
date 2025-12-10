// StorageManager - IndexedDB ile büyük kapasiteli depolama yönetimi
export class StorageManager {
  constructor(dbName = 'DuctCalcDB', storeName = 'orders', version = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
    this.db = null;
  }

  /**
   * IndexedDB veritabanını başlat
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB açılamadı:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Object store oluştur (eğer yoksa)
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * LocalStorage'dan IndexedDB'ye veri taşı (migrasyon)
   * @param {string} localStorageKey - LocalStorage key
   */
  async migrateFromLocalStorage(localStorageKey = 'ductcalc-orders') {
    try {
      const oldData = localStorage.getItem(localStorageKey);
      if (!oldData) return;

      const cart = JSON.parse(oldData);
      if (!Array.isArray(cart) || cart.length === 0) return;

      console.log(`Migrating ${cart.length} items from localStorage to IndexedDB...`);

      // Tüm öğeleri IndexedDB'ye aktar
      for (const item of cart) {
        await this.addItem(item);
      }

      // Başarılı migrasyon sonrası localStorage'ı temizle
      localStorage.removeItem(localStorageKey);
      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration error:', error);
    }
  }

  /**
   * Yeni öğe ekle
   * @param {Object} item - Eklenecek öğe
   * @returns {Promise<boolean>}
   */
  async addItem(item) {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.add(item);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Add item error:', error);
      throw error;
    }
  }

  /**
   * Öğeyi güncelle
   * @param {Object} item - Güncellenecek öğe (id içermeli)
   * @returns {Promise<boolean>}
   */
  async updateItem(item) {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.put(item);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Update item error:', error);
      return false;
    }
  }

  /**
   * Öğeyi sil
   * @param {string} id - Silinecek öğenin ID'si
   * @returns {Promise<boolean>}
   */
  async removeItem(id) {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Remove item error:', error);
      return false;
    }
  }

  /**
   * Tek bir öğeyi getir
   * @param {string} id - Öğe ID'si
   * @returns {Promise<Object|null>}
   */
  async getItem(id) {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Get item error:', error);
      return null;
    }
  }

  /**
   * Tüm öğeleri getir
   * @returns {Promise<Array>}
   */
  async getAllItems() {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Get all items error:', error);
      return [];
    }
  }

  /**
   * Tüm öğeleri sil
   * @returns {Promise<boolean>}
   */
  async clearAll() {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Clear all error:', error);
      return false;
    }
  }

  /**
   * Depolama kullanımını tahmin et
   * @returns {Promise<Object>} - { usage: bytes, quota: bytes, percentage: number }
   */
  async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
          percentage: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(2) : 0,
          usageMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
          quotaMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2)
        };
      } catch (error) {
        console.error('Storage estimate error:', error);
      }
    }
    return { usage: 0, quota: 0, percentage: 0, usageMB: 0, quotaMB: 0 };
  }
}
