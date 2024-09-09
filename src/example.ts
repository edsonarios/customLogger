import { CustomLogger } from './cdkLogger'

// .env file, STAGE=local
const logger = new CustomLogger(`exampleContext`)
const object = {
  key: 'value',
  inside: { key2: 'value2', key3: 'value3' },
  inside2: { key4: 'value5', key5: 'value5' },
}
logger.log('log message', object, 'string', object)
logger.error('error message')
logger.warn('warn message')
logger.debug('debug message')
logger.verbose('verbose message')
