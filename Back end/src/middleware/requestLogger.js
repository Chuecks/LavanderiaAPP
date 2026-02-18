const morgan = require('morgan');
const getLogger = require('../utils/logger');

const logger = getLogger('http');

// Formato personalizado para Morgan
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Crear stream personalizado para Morgan
const stream = {
  write: (message) => {
    // Morgan ya incluye un salto de línea al final
    logger.info(message.trim(), {
      service: 'http',
      action: 'HTTP_REQUEST'
    });
  }
};

// Middleware de Morgan
const morganMiddleware = morgan(morganFormat, {
  stream,
  skip: (req, res) => {
    // Ignorar requests a health checks y rutas estáticas
    if (req.path === '/health' || req.path === '/favicon.ico') {
      return true;
    }
    // En producción, solo loguear errores (status >= 400)
    if (process.env.NODE_ENV === 'production') {
      return res.statusCode < 400;
    }
    return false;
  }
});

// Middleware personalizado para extractar IPs y loguear errores de requests
const requestContextMiddleware = (req, res, next) => {
  // Extraer IP real (considerando proxies)
  req.ipAddress = 
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    req.connection.remoteAddress ||
    req.ip ||
    'unknown';

  // Agregar método para loguear errores específicos
  req.logError = (error, context = {}) => {
    logger.error(`Error en ${req.method} ${req.path}`, {
      service: 'api',
      action: 'API_ERROR',
      method: req.method,
      path: req.path,
      userId: req.usuario?._id,
      ipAddress: req.ipAddress,
      error: error?.message || error,
      stack: error?.stack,
      ...context
    });
  };

  // Capturar cuando se envía la respuesta
  const originalSend = res.send;
  res.send = function(data) {
    // Loguear si la respuesta fue un error
    if (res.statusCode >= 500) {
      logger.error(`Server Error en ${req.method} ${req.path}`, {
        service: 'api',
        action: 'API_SERVER_ERROR',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        userId: req.usuario?._id,
        ipAddress: req.ipAddress,
        response: typeof data === 'string' ? data.substring(0, 200) : data
      });
    } else if (res.statusCode >= 400) {
      logger.warn(`Client Error en ${req.method} ${req.path}`, {
        service: 'api',
        action: 'API_CLIENT_ERROR',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        userId: req.usuario?._id,
        ipAddress: req.ipAddress
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

module.exports = {
  morganMiddleware,
  requestContextMiddleware
};
