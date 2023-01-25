import { createClient } from 'redis';

const client = createClient({ url: process.env.db });

client.connect().then(() => {
  console.log('Redis connected');
});

client.on('error', (err) => console.log('[Redis] Redis Error', err));

interface Data {
  key: string,
  value?: number
}

export default {
  isExist: async (data: Data) => client.EXISTS(data.key),
  getData: async (data: Data) => client.GET(data.key),
  createKey: async (data: Data) => client.SET(data.key.toLocaleLowerCase(), 0),
  setValue: async (data: Data) => client.SET(data.key, Number(data.value) || 0),
  delKey: async (data: Data) => client.DEL(data.key),
};
