import { Logger as PowertoolsLogger } from '@aws-lambda-powertools/logger'
import { inspect } from 'util'
import * as winston from 'winston'
import * as Transport from 'winston-transport'
import { cyan, green, magenta, red, yellow } from 'colors'

const deployEnv = process.env.DEPLOYMENT_ENV as string

export class CustomLogger extends PowertoolsLogger {
  private readonly logger: winston.Logger
  private readonly isLocal: boolean

  constructor(private readonly context?: string) {
    super({
      environment: deployEnv,
      persistentLogAttributes: {
        aws_account_id: process.env.AWS_ACCOUNT_ID || 'N/A',
        aws_region: process.env.AWS_REGION || 'N/A',
      },
    })
    this.isLocal = process.env.STAGE === 'local'

    const transports: Transport[] = [
      new winston.transports.Console({
        format: winston.format.printf(
          ({ level, message, context, timestamp }) => {
            const contextMessage = `[${context || this.context || 'App'}]`
            const cdk = colorizedMessage(level, '[CDK]')
            const parsedLevelMessage = level === 'info' ? 'log' : level
            const levelMessage = colorizedMessage(
              level,
              parsedLevelMessage.toUpperCase(),
            )
            const messageToLog = formatMessages(level, message)
            if (this.isLocal) {
              return `${cdk} ${timestamp} ${levelMessage} ${yellow(contextMessage)} ${messageToLog}`
            } else {
              return `[CDK] ${parsedLevelMessage.toUpperCase()} ${contextMessage} ${messageToLog}`
            }
          },
        ),
      }),
    ]
    this.logger = winston.createLogger({
      level: process.env.LEVEL_DEBUG || 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'user-service' },
      transports,
    })
  }

  setNewContext(context: string) {
    return new CustomLogger(context)
  }

  log(...messages: any[]) {
    this.logger.info(messages)
  }

  info(...messages: any[]) {
    this.logger.info(messages)
  }

  error(...messages: any[]) {
    this.logger.error(messages)
  }

  warn(...messages: any[]) {
    this.logger.warn(messages)
  }

  debug(...messages: any[]) {
    this.logger.debug(messages)
  }

  verbose(...messages: any[]) {
    this.logger.verbose(messages)
  }
}

function colorizedMessage(level: string, message: string) {
  let coloredMessage = message

  switch (level) {
    case 'error':
      coloredMessage = red(message)
      break
    case 'warn':
      coloredMessage = yellow(message)
      break
    case 'debug':
      coloredMessage = magenta(message)
      break
    case 'verbose':
      coloredMessage = cyan(message)
      break
    case 'log':
      coloredMessage = green(message)
      break
    case 'info':
    default:
      coloredMessage = green(message)
      break
  }
  return coloredMessage
}

export function formatMessages(level: string, messages: any[]) {
  const { STAGE } = process.env
  return messages
    .map((message) => {
      if (STAGE === 'local') {
        return typeof message === 'object'
          ? inspect(message, { depth: null, colors: true })
          : colorizedMessage(level, message)
      } else {
        return typeof message === 'object' ? JSON.stringify(message) : message
      }
    })
    .join(' ')
}
