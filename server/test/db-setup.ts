import { Sequelize } from 'sequelize'

let testSequelize: Sequelize | null = null

export async function setupTestDB(): Promise<Sequelize> {
  if (!testSequelize) {
    testSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    })
  }

  await testSequelize.authenticate()
  return testSequelize
}

export async function resetTestDB(force: boolean = true): Promise<void> {
  if (!testSequelize) {
    throw new Error('Test DB not initialized. Call setupTestDB() first.')
  }
  await testSequelize.sync({ force })
}

export async function teardownTestDB(): Promise<void> {
  if (testSequelize) {
    await testSequelize.close()
    testSequelize = null
  }
}

export function getTestSequelize(): Sequelize {
  if (!testSequelize) {
    throw new Error('Test DB not initialized. Call setupTestDB() first.')
  }
  return testSequelize
}


