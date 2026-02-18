const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Crear directorios de logs si no existen
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isDevelopment = process.env.NODE_ENV !== 'production';

// Formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Colores para consola (solo desarrollo)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'blue',
  debug: 'gray'
};

winston.addColors(colors);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => {
    const level = info.level;
    const timestamp = info.timestamp;
    const message = info.message;
    const service = info.service || 'app';
    return `${timestamp} [${service}] ${level}: ${message}`;
  })
);

// Transportes
const transports = [
  // Consola (siempre)
  new winston.transports.Console({
    format: consoleFormat
  }),

  // Archivo de errores (diario, máx 14 días)
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: customFormat,
    maxDays: 14,
    maxSize: '20m'
  }),

  // Archivo de autenticación (diario, máx 60 días)
  new DailyRotateFile({
    filename: path.join(logsDir, 'auth-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    format: customFormat,
    maxDays: 60,
    maxSize: '20m'
  }),

  // Archivo de negocio (diario, máx 60 días)
  new DailyRotateFile({
    filename: path.join(logsDir, 'business-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    format: customFormat,
    maxDays: 60,
    maxSize: '20m'
  }),

  // Archivo de infraestructura (diario, máx 30 días)
  new DailyRotateFile({
    filename: path.join(logsDir, 'infrastructure-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    format: customFormat,
    maxDays: 30,
    maxSize: '20m'
  })
];

// Logger principal
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: customFormat,
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxDays: 14,
      maxSize: '20m'
    })
  ]
});

// Loggers especializados por módulo
const getLogger = (service = 'app') => {
  return {
    // Autenticación
    loginSuccess: (email, userId, ipAddress = 'unknown') => {
      logger.info('LOGIN_SUCCESS', {
        service: 'auth',
        action: 'LOGIN_SUCCESS',
        email,
        userId,
        ipAddress,
        message: `Usuario ${email} logueado exitosamente`
      });
    },

    loginFailure: (email, reason, ipAddress = 'unknown') => {
      logger.warn('LOGIN_FAILURE', {
        service: 'auth',
        action: 'LOGIN_FAILURE',
        email,
        reason,
        ipAddress,
        message: `Intento de login fallido para ${email}: ${reason}`
      });
    },

    registerSuccess: (email, role, userId) => {
      logger.info('REGISTER_SUCCESS', {
        service: 'auth',
        action: 'REGISTER_SUCCESS',
        email,
        role,
        userId,
        message: `Nuevo usuario registrado: ${email} (${role})`
      });
    },

    registerFailure: (email, reason) => {
      logger.warn('REGISTER_FAILURE', {
        service: 'auth',
        action: 'REGISTER_FAILURE',
        email,
        reason,
        message: `Registro fallido para ${email}: ${reason}`
      });
    },

    logout: (email, userId) => {
      logger.info('LOGOUT', {
        service: 'auth',
        action: 'LOGOUT',
        email,
        userId,
        message: `Usuario ${email} cerró sesión`
      });
    },

    passwordChange: (email, userId, success = true) => {
      const action = success ? 'PASSWORD_CHANGED' : 'PASSWORD_CHANGE_FAILED';
      logger.info(action, {
        service: 'auth',
        action,
        email,
        userId,
        message: `Cambio de contraseña ${success ? 'exitoso' : 'fallido'} para ${email}`
      });
    },

    // Negocio
    orderCreated: (orderId, userId, launderyId, amount) => {
      logger.info('ORDER_CREATED', {
        service: 'business',
        action: 'ORDER_CREATED',
        orderId,
        userId,
        launderyId,
        amount,
        message: `Pedido ${orderId} creado por usuario ${userId}`
      });
    },

    orderStatusChanged: (orderId, oldStatus, newStatus, userId) => {
      logger.info('ORDER_STATUS_CHANGED', {
        service: 'business',
        action: 'ORDER_STATUS_CHANGED',
        orderId,
        oldStatus,
        newStatus,
        userId,
        message: `Pedido ${orderId} cambió de ${oldStatus} a ${newStatus}`
      });
    },

    directionCreated: (directionId, userId) => {
      logger.info('DIRECTION_CREATED', {
        service: 'business',
        action: 'DIRECTION_CREATED',
        directionId,
        userId,
        message: `Dirección ${directionId} creada por usuario ${userId}`
      });
    },

    serviceUpdated: (launderyId, services) => {
      logger.info('SERVICE_UPDATED', {
        service: 'business',
        action: 'SERVICE_UPDATED',
        launderyId,
        servicesCount: services?.length || 0,
        message: `Servicios actualizados para lavandería ${launderyId}`
      });
    },

    // Infraestructura
    databaseConnected: (connectionString = 'MongoDB') => {
      logger.info('DATABASE_CONNECTED', {
        service: 'infrastructure',
        action: 'DATABASE_CONNECTED',
        database: connectionString,
        message: `Conectado a ${connectionString}`
      });
    },

    databaseError: (error, context = '') => {
      logger.error('DATABASE_ERROR', {
        service: 'infrastructure',
        action: 'DATABASE_ERROR',
        context,
        error: error?.message || error,
        message: `Error de base de datos: ${error?.message || error}`,
        stack: error?.stack
      });
    },

    emailSent: (email, type, messageId) => {
      logger.info('EMAIL_SENT', {
        service: 'infrastructure',
        action: 'EMAIL_SENT',
        email,
        type,
        messageId,
        message: `Email ${type} enviado a ${email}`
      });
    },

    emailFailed: (email, type, error) => {
      logger.error('EMAIL_FAILED', {
        service: 'infrastructure',
        action: 'EMAIL_FAILED',
        email,
        type,
        error: error?.message || error,
        message: `Error al enviar email ${type} a ${email}`,
        stack: error?.stack
      });
    },

    rabbitmqConnected: () => {
      logger.info('RABBITMQ_CONNECTED', {
        service: 'infrastructure',
        action: 'RABBITMQ_CONNECTED',
        message: 'Conectado a RabbitMQ'
      });
    },

    rabbitmqError: (error, context = '') => {
      logger.error('RABBITMQ_ERROR', {
        service: 'infrastructure',
        action: 'RABBITMQ_ERROR',
        context,
        error: error?.message || error,
        message: `Error de RabbitMQ: ${error?.message || error}`,
        stack: error?.stack
      });
    },

    serverStarted: (port, env) => {
      logger.info('SERVER_STARTED', {
        service: 'infrastructure',
        action: 'SERVER_STARTED',
        port,
        environment: env,
        timestamp: new Date().toISOString(),
        message: `Servidor iniciado en puerto ${port} (${env})`
      });
    },

    // Errores genéricos
    error: (message, error, context = {}) => {
      logger.error(message, {
        service: context.service || service,
        action: context.action || 'ERROR',
        error: error?.message || error,
        message,
        stack: error?.stack,
        ...context
      });
    },

    warn: (message, context = {}) => {
      logger.warn(message, {
        service: context.service || service,
        action: context.action || 'WARNING',
        message,
        ...context
      });
    },

    info: (message, context = {}) => {
      logger.info(message, {
        service: context.service || service,
        action: context.action || 'INFO',
        message,
        ...context
      });
    },

    debug: (message, context = {}) => {
      if (isDevelopment) {
        logger.debug(message, {
          service: context.service || service,
          action: context.action || 'DEBUG',
          message,
          ...context
        });
      }
    }
  };
};

module.exports = getLogger;
