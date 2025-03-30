class IndexedDBManager {
  constructor(dbName, storeName) {
      this.dbName = dbName;
      this.storeName = storeName;
      this.db = null;
  }

  async init() {
      if (this.db) {
          return;
      }

      this.db = await new Promise((resolve, reject) => {
          const openRequest = indexedDB.open(this.dbName, 1);

          openRequest.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains(this.storeName)) {
                  db.createObjectStore(this.storeName, { keyPath: "id", autoIncrement: true });
              }
          };

          openRequest.onsuccess = () => resolve(openRequest.result);
          openRequest.onerror = () => reject(openRequest.error);
      });
  }

  async add(item) {
      const tx = this.db.transaction([this.storeName], "readwrite");
      const store = tx.objectStore(this.storeName);

      return await this._transactionPromise(tx, store.add(item));
  }

  async getById(id) {
      const tx = this.db.transaction([this.storeName], "readonly");
      const store = tx.objectStore(this.storeName);

      return await this._transactionPromise(tx, store.get(id));
  }

  async getAll() {
      const tx = this.db.transaction([this.storeName], "readonly");
      const store = tx.objectStore(this.storeName);

      return await this._transactionPromise(tx, store.getAll());
  }

  async update(id, updatedData) {
      const tx = this.db.transaction([this.storeName], "readwrite");
      const store = tx.objectStore(this.storeName);
      
      let data = await this._transactionPromise(tx, store.get(id));
      if (!data) {
          throw new Error('Item not found');
      }

      data = { ...data, ...updatedData };
      return await this._transactionPromise(tx, store.put(data));
  }

  async delete(id) {
      const tx = this.db.transaction([this.storeName], "readwrite");
      const store = tx.objectStore(this.storeName);

      await this._transactionPromise(tx, store.delete(id));
  }

  // Utility function to handle transactions and promisify request responses
  _transactionPromise(tx, request) {
      return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
          tx.oncomplete = () => resolve(request.result); // Transaction success
          tx.onerror = () => reject(tx.error); // Transaction failed
      });
  }
}
