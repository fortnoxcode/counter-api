import fastify, { RouteShorthandOptions } from 'fastify';
import * as swagger from '@fastify/swagger';
import * as swaggerUI from '@fastify/swagger-ui';
import db from './lib/db.js';

const server = fastify();

await server.register(swagger, {
  swagger: {
    info: {
      title: 'counter-api',
      version: '1.0.0',
    },
    host: `${process.env.port}`,
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
  },
});

await server.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  staticCSP: true,
  transformSpecificationClone: true,
});

server.setErrorHandler((err, req, resp) => {
  const data = {
    success: false,
    body: '',
  };

  if (!err?.validation?.length) {
    console.log(err);
  }

  if (err?.validation?.length) {
    data.body = err.validation[0]?.message || '';
  }

  resp.status(500).send(data);
});

const paramsProps = {
  key: {
    type: 'string',
    pattern: '^(\\w){3,10}$',
  },
  count: {
    type: 'integer',
    minimum: 1,
    maximum: 1000,
  },
};

const resp = {
  200: {
    description: 'Successful response',
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      body: {
        type: 'integer',
      },
    },
  },
  500: {
    description: 'Failed',
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      body: {
        optional: true,
        type: 'string',
      },
    },
  },
};

const createOpts: RouteShorthandOptions = {
  schema: {
    params: {
      type: 'object',
      properties: {
        key: paramsProps.key,
      },
    },
    response: {
      200: resp[200],
      500: resp[500],
    },
  },
};

const setOpts: RouteShorthandOptions = {
  schema: {
    params: {
      type: 'object',
      properties: {
        key: paramsProps.key,
        count: paramsProps.count,
      },
    },
    response: {
      200: resp[200],
      500: resp[500],
    },
  },
};

const addOpts: RouteShorthandOptions = {
  schema: {
    params: {
      type: 'object',
      properties: {
        key: paramsProps.key,
        count: paramsProps.count,
      },
    },
    response: {
      200: resp[200],
      500: resp[500],
    },
  },
};

interface SingleKeyParam {
  Params: {
    key: string,
  }
}

interface KeyAndCountParam {
  Params: {
    key: string,
    count: number,
  }
}

server.get<SingleKeyParam>('/create/:key', createOpts, async (req, response) => {
  if (await db.isExist({ key: req.params.key })) {
    response.statusCode = 500;
    return {
      sucess: false,
      body: 'Key already exists',
    };
  }
  db.createKey({ key: req.params.key });
  return {
    success: true,
    body: await db.getData({ key: req.params.key }),
  };
});

server.get<KeyAndCountParam>('/set/:key/:count', setOpts, async (req, response) => {
  if (await db.isExist({ key: req.params.key })) {
    await db.setValue({ key: req.params.key, value: req.params.count });
    return {
      sucess: true,
      body: await db.getData({ key: req.params.key }),
    };
  }
  response.statusCode = 500;
  return {
    success: false,
    body: 'Key is not found',
  };
});

server.get<KeyAndCountParam>('/add/:key/:count', addOpts, async (req, response) => {
  if (await db.isExist({ key: req.params.key })) {
    const currValue = await db.getData({ key: req.params.key });
    await db.setValue({ key: req.params.key, value: Number(currValue) + req.params.count });
    return {
      success: true,
      body: await db.getData({ key: req.params.key }),
    };
  }
  response.statusCode = 500;
  return {
    success: false,
    body: 'Key is not found',
  };
});

server.get<SingleKeyParam>('/hit/:key', addOpts, async (req, response) => {
  if (await db.isExist({ key: req.params.key })) {
    const currValue = await db.getData({ key: req.params.key });
    await db.setValue({ key: req.params.key, value: Number(currValue) + 1 });
    return {
      success: true,
      body: await db.getData({ key: req.params.key }),
    };
  }
  response.statusCode = 500;
  return {
    success: false,
    body: 'Key is not found',
  };
});

server.get<SingleKeyParam>('/del/:key', addOpts, async (req, response) => {
  if (await db.isExist({ key: req.params.key })) {
    await db.delKey({ key: req.params.key });
    return {
      success: true,
    };
  }
  response.statusCode = 500;
  return {
    success: false,
    body: 'Key is not found',
  };
});

server.ready((err) => {
  if (err) {
    throw err;
  }

  server.swagger();
});

server.listen({
  port: Number(process.env.port),
  host: '0.0.0.0',
}, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
