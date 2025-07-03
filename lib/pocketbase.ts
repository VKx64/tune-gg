import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.EXPO_PUBLIC_POCKETBASE_URL);

export default pb;
