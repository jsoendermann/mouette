import { Db, MongoClient } from 'mongodb'


export class DbWrapper {
  private connectionPromise: Promise<Db>

  constructor(private mongoUrl: string) {}

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

}