import { Db, MongoClient } from 'mongodb'


export interface IDb {
  doesContainInCollection(collectionName: string, query: any): Promise<boolean>
  getCollectionNames(): Promise<string[]>
  getKeysInCollection(collectionName: string): Promise<string[]>
  close(): Promise<void>
}

export class MongoDbWrapper implements IDb {
  private connectionPromise: Promise<Db>

  // Used for caching
  private collectionNames: Promise<string[]> | null = null
  private collectionToKeys: Map<string, Promise<string[]>> = new Map()

  constructor(private mongoUri: string) { }

  private async getDb(): Promise<Db> {
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = MongoClient.connect(this.mongoUri).then((db: Db) => {
      if (!db) {
        delete this.connectionPromise
        throw new Error('db is falsy')
      }

      db.on('error', () => delete this.connectionPromise)
      db.on('close', () => delete this.connectionPromise)

      return db
    }).catch(error => {
      delete this.connectionPromise
      return Promise.reject(error)
    })

    return this.connectionPromise
  }

  public async close() {
    const db = await this.connectionPromise
    db.close()
  }

  public async doesContainInCollection(collectionName: string, query: any): Promise<boolean> {
    const db = await this.getDb()
    const recordCount = await db.collection(collectionName).count(query)
    return recordCount > 0
  }

  public async getCollectionNames(): Promise<string[]> {
    if (this.collectionNames) {
      return this.collectionNames
    }

    this.collectionNames = this.getDb().then(async db => {
      const collectionDetails = await db.listCollections({}).toArray()
      return collectionDetails
        .map(d => d.name)
        .filter(n => !n.startsWith('system.'))
    })

    return this.collectionNames
  }

  public async getKeysInCollection(collectionName: string): Promise<string[]> {
    const keysInCollection = this.collectionToKeys.get(collectionName)

    if (keysInCollection) {
      return keysInCollection
    }

    const promise = this.getDb().then(async db => {
      const result = await db.collection(collectionName).mapReduce(
        'function () { for (var key in this) { emit(key, null) } }',
        'function () {}',
        { out: { inline: 1 } },
      )

      return result.map((k: any) => k._id) as string[]
    })

    this.collectionToKeys.set(collectionName, promise)
    return promise
  }
}

export class TestDbWrapper implements IDb {
  public async doesContainInCollection(collectionName: string, query: any): Promise<boolean> {
    return true
  }
  public async getCollectionNames(): Promise<string[]> {
    return []
  }
  public async getKeysInCollection(collectionName: string): Promise<string[]> {
    return []
  }
  public async close(): Promise<void> {
    return
  }
}
