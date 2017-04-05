import { Db, MongoClient } from 'mongodb'


export type MongoType =
  | 'missing'
  | 'null'
  | 'boolean'
  | 'number'
  | 'string'
  | 'array'
  | 'object'
  | 'ObjectId'
  | 'Date'

export interface IDb {
  /**
   * Returns the names of all collections in the db. Calling this method is very cheap since it caches the result.
   *
   * @returns {Promise<string[]>} A promise that resolves to an array containing the collection names.
   *
   * @memberOf IDb
   */
  getCollectionNames(): Promise<string[]>

  /**
   * Returns the union of the keys of all documents in the collection. Calling this method is very cheap
   * since it caches the result.
   *
   * @param {string} collectionName The collection for which you want to get key names.
   * @returns {Promise<string[]>} A promise that resolves to an array containing the key names.
   *
   * @memberOf IDb
   */
  getKeysInCollection(collectionName: string): Promise<string[]>

  /**
   * Returns the types of the values found in the given column. Calling this method is very cheap since it
   * caches the result.
   *
   * @param {string} collectionName The collection that contains the column.
   * @param {string} keyName The name of the column.
   * @returns {Promise<MongoType[]>} A promise that resolves to an array containing all the MongoTypes that
   * are found in the column.
   *
   * @memberOf IDb
   */
  getTypesOfKeyInCollection(collectionName: string, keyName: string): Promise<MongoType[]>

  /**
   * Whether any documents satisfying the given query exist in the collection.
   *
   * @param {string} collectionName The name of the collection.
   * @param {*} query A MongoDB query
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the collection doe
   * contain at least one document that satisfies the query.
   *
   * @memberOf IDb
   */
  doesContainInCollection(collectionName: string, query: any): Promise<boolean>

  /**
   * Closes the connection to the db.
   *
   * @returns {Promise<void>} A promise that gets resolved when the connection has been closed.
   *
   * @memberOf IDb
   */
  close(): Promise<void>
}

export class MongoDbWrapper implements IDb {
  private connectionPromise: Promise<Db>

  // Used for caching
  private collectionNames: Promise<string[]> | null = null
  private collectionToKeys: Map<string, Promise<string[]>> = new Map()
  private collectionToKeyToTypes: Map<string, Promise<Map<string, MongoType[]>>> = new Map()

  constructor(private mongoUrl: string) { }

  private async getDb(): Promise<Db> {
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = MongoClient.connect(this.mongoUrl).then((db: Db) => {
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

  private async getTypesOfKeysInCollection(
    collectionName: string,
  ): Promise<Map<string, MongoType[]>> {
    const keyToType = this.collectionToKeyToTypes.get(collectionName)

    if (keyToType) {
      return keyToType
    }

    const promise = this.getDb().then(async db => {
      const keys = await this.getKeysInCollection(collectionName)
      const result = await db.collection(collectionName).mapReduce(
        `
      function() {
        var keys = ["${keys.join('","')}"];
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var value = this[key];
          var result;
          if (value instanceof ObjectId) {
            result = {'ObjectId': true};
          } else if (value instanceof Date) {
            result = {'Date': true};
          } else if (value === null) {
            result = {'null': true};
          } else if (value === undefined) {
            result = {'missing': true};
          } else {
            var type = typeof value;
            result = {};
            result[type] = true;
          }
          emit(key, result)
        }
      }
      `
        ,
        `
      function (key, values) {
        var result = {};
        for (var i = 0; i < values.length; i++) {
          var value = values[i];
          for (var type in value) {
            if (value.hasOwnProperty(type) && value[type]) {
              print(type)
              result[type] = true;
            }
          }
        }
        return result;
      }
      `,
        { out: { inline: 1 } },
      )

      const map = new Map<string, MongoType[]>()
      result.forEach(({ _id, value }: { _id: string, value: any }) => {
        const types: MongoType[] = []
        Object.keys(value).forEach(type => types.push(type as MongoType))
        map.set(_id, types)
      })

      return map
    })

    this.collectionToKeyToTypes.set(collectionName, promise)

    return promise
  }

  public async getTypesOfKeyInCollection(
    collectionName: string,
    keyName: string,
  ): Promise<MongoType[]> {
    const types = this
      .getTypesOfKeysInCollection(collectionName)
      .then(keysToType => keysToType.get(keyName)!)
    return types
  }

  public async doesContainInCollection(collectionName: string, query: any): Promise<boolean> {
    const db = await this.getDb()
    const record = await db.collection(collectionName).findOne(query)
    return !!record
  }

  public async close() {
    const db = await this.connectionPromise
    db.close()
  }
}


export class TestDbWrapper implements IDb {
  public async getCollectionNames(): Promise<string[]> {
    throw new Error('getCollectionNames should be mocked')
  }

  public async getKeysInCollection(collectionName: string): Promise<string[]> {
    throw new Error('getKeysInCollection should be mocked')
  }

  public async getTypesOfKeyInCollection(
    collectionName: string,
    keyName: string,
  ): Promise<MongoType[]> {
    throw new Error('getTypesOfKeyInCollection should be mocked')
  }

  public async doesContainInCollection(collectionName: string, query: any): Promise<boolean> {
    throw new Error('doesContainInCollection should be mocked')
  }

  public async close(): Promise<void> {
    throw new Error('close should be mocked')
  }
}
