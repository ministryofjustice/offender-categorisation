const { execSync } = require('child_process')
const path = require('path')

const containerName = 'form-builder-unit-tests-db'
const knexUnitTestConfig = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5434,
    user: 'form-builder',
    password: 'form-builder',
    database: 'form-builder-unit-tests',
    ssl: false,
  },
  debug: true,
  migrations: {
    directory: path.join(__dirname, '/../../migrations'),
  },
}
const knex = require('knex')(knexUnitTestConfig)

const migrate = async () => {
  try {
    // start the database container
    execSync(
      `docker run --name ${containerName} -d -p ${knexUnitTestConfig.connection.port}:5432 -e POSTGRES_USER=${knexUnitTestConfig.connection.user} -e POSTGRES_PASSWORD=${knexUnitTestConfig.connection.password} -e POSTGRES_DB=${knexUnitTestConfig.connection.database} -e POSTGRES_HOST_AUTH_METHOD=md5 postgres:14.3`
    )
    // wait for the database to be ready
    // await knex.raw('DROP DATABASE IF EXISTS "form-builder-unit-tests";')
    // await knex.raw('CREATE DATABASE "form-builder-unit-tests";')
    await new Promise(resolve => setTimeout(resolve, 5000))
    // run knex migrations
    await knex.migrate.latest()
    // console.log('migration complete')
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
  }
}

const rollback = async () => {
  try {
    // rollback knex migrations
    await knex.migrate.rollback()
    // stop the database container
    execSync(`docker stop ${containerName}`)
    execSync(`docker rm ${containerName}`)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
  }
}

module.exports = {
  knex,
  migrate,
  rollback,
}

describe('cm testing', () => {
  const fakePrisoner = {
    id: 1234,
    form_response: {
      question1: 'answer1',
      question2: 'answer2',
      question3: 'answer3',
    },
    booking_id: 5678,
    user_id: 'user123',
    status: 'pending',
    assigned_user_id: 'user456',
    referred_date: '2022-02-01T10:30:00Z',
    referred_by: 'referral123',
    sequence_no: 1,
    risk_profile: {
      risk_factor1: true,
      risk_factor2: false,
      risk_factor3: true,
    },
    prison_id: 'ABC',
    offender_no: 'FK1234',
    start_date: '2022-01-01T12:00:00Z',
    security_reviewed_by: 'security123',
    security_reviewed_date: '2022-01-15T10:30:00Z',
    approval_date: '2022-01-20',
    cat_type: 'INITIAL',
    nomis_sequence_no: 123,
    assessment_date: '2022-01-10',
    approved_by: 'approver123',
    assessed_by: 'assessor123',
    review_reason: 'MANUAL',
    due_by_date: '2022-02-28',
    cancelled_date: null,
    cancelled_by: null,
  }

  test('that the inserted record is retrievable', async () => {
    await migrate()

    await knex('form').insert(fakePrisoner)

    const result = await knex.select('offender_no', 'prison_id').from('form').where('id', 1234)

    // console.log('result', result)
    expect(result[0].offender_no).toEqual('FK1234')
    expect(result[0].prison_id).toEqual('ABC')

    expect(true).toBeTruthy()
  }, 7500)

  afterEach(async () => {
    await rollback()
  })
})
