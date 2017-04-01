import { Db, MongoClient } from 'mongodb'


export interface IMapReduceResultElement {
  _id: string
  value: any
}

export type MapReduceResult = IMapReduceResultElement[]

// TODO Do we have to check for NumberInt/NumberDecimal types?
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
  doesContainInCollection(collectionName: string, query: any): Promise<boolean>
  getCollectionNames(): Promise<string[]>
  getKeysInCollection(collectionName: string): Promise<string[]>
  getTypesOfKeysInCollection(collectionName: string): Promise<Map<string, MongoType[]>>
  getTypesOfKeyInCollection(collectionName: string, keyName: string): Promise<MongoType[]>
  mapReduceOnCollection(
    collectionName: string,
    map: string,
    reduce: string,
  ): Promise<MapReduceResult>
  mapReduceOnCollectionDoesProduceResults(
    collectionName: string,
    map: string,
    reduce: string,
  ): Promise<boolean>
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

  public async getTypesOfKeysInCollection(
    collectionName: string,
  ): Promise<Map<string, MongoType[]>> {
    const keyToType = this.collectionToKeyToTypes.get(collectionName)

    if (keyToType) {
      return keyToType
    }

    const db = await this.getDb()
    const keys = await this.getKeysInCollection(collectionName)
    const result = await db.collection(collectionName).mapReduce(
      `
      function() {
        for (var key in ["${keys.join('","')}"]) {
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

    this.collectionToKeyToTypes.set(collectionName, Promise.resolve(map))

    return map
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

  public async mapReduceOnCollection(
    collectionName: string,
    map: string,
    reduce: string,
  ): Promise<MapReduceResult> {
    const db = await this.getDb()
    return db.collection(collectionName).mapReduce(
      map,
      reduce,
      { out: { inline: 1 } },
    )
  }

  public async mapReduceOnCollectionDoesProduceResults(
    collectionName: string,
    map: string,
    reduce: string,
  ): Promise<boolean> {
    const mapReduceResult = await this.mapReduceOnCollection(collectionName, map, reduce)
    return mapReduceResult.length > 0
  }

  public async close() {
    const db = await this.connectionPromise
    db.close()
  }
}


export class TestDbWrapper implements IDb {
  public async doesContainInCollection(collectionName: string, query: any): Promise<boolean> {
    throw new Error('doesContainInCollection should be mocked')
  }

  public async getCollectionNames(): Promise<string[]> {
    throw new Error('getCollectionNames should be mocked')
  }

  public async getKeysInCollection(collectionName: string): Promise<string[]> {
    throw new Error('getKeysInCollection should be mocked')
  }

  public async getTypesOfKeysInCollection(
    collectionName: string,
  ): Promise<Map<string, MongoType[]>> {
    throw new Error('getTypesOfKeysInCollection should be mocked')
  }

  public async getTypesOfKeyInCollection(
    collectionName: string,
    keyName: string,
  ): Promise<MongoType[]> {
    throw new Error('getTypesOfKeyInCollection should be mocked')
  }

  public async mapReduceOnCollection(
    collectionName: string,
    map: string,
    reduce: string,
  ): Promise<MapReduceResult> {
    throw new Error('mapReduceOnCollection should be mocked')
  }

  public async mapReduceOnCollectionDoesProduceResults(
    collectionName: string,
    map: string,
    reduce: string,
  ): Promise<boolean> {
    throw new Error('mapReduceOnCollectionDoesProduceResults should be mocked')
  }

  public async close(): Promise<void> {
    throw new Error('close should be mocked')
  }
}
