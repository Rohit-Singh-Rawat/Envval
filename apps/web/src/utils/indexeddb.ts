export interface IndexedDBOptions {
	dbName: string;
	version?: number;
	storeName: string;
	keyPath?: string;
}

async function openIndexedDB(options: IndexedDBOptions): Promise<IDBDatabase> {
	const { dbName, version = 1, storeName, keyPath = 'id' } = options;

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, version);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(storeName)) {
				db.createObjectStore(storeName, { keyPath });
			}
		};
	});
}

export async function saveToIndexedDB<T>(
	options: IndexedDBOptions,
	key: string,
	data: T
): Promise<void> {
	const db = await openIndexedDB(options);

	return new Promise((resolve, reject) => {
		const transaction = db.transaction(options.storeName, 'readwrite');
		const store = transaction.objectStore(options.storeName);
		const request = store.put({ [options.keyPath || 'id']: key, data });

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

export async function getFromIndexedDB<T>(options: IndexedDBOptions, key: string): Promise<T | null> {
	const db = await openIndexedDB(options);

	return new Promise((resolve, reject) => {
		const transaction = db.transaction(options.storeName, 'readonly');
		const store = transaction.objectStore(options.storeName);
		const request = store.get(key);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const result = request.result;
			resolve(result ? result.data : null);
		};
	});
}

export async function deleteFromIndexedDB(options: IndexedDBOptions, key: string): Promise<void> {
	const db = await openIndexedDB(options);

	return new Promise((resolve, reject) => {
		const transaction = db.transaction(options.storeName, 'readwrite');
		const store = transaction.objectStore(options.storeName);
		const request = store.delete(key);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}
