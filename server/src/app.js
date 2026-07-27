const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const routes = require('./routes');
const auditLogger = require('./middlewares/auditLogger');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
console.log("CLIENT_URL =", env.clientUrl);
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
}

app.use('/api/v1', auditLogger);
app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
