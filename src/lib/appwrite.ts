import { Client, Account, Databases } from 'appwrite';

export const client = new Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6a15e01e003b014edc62');

export const account = new Account(client);
export const databases = new Databases(client);

export const DB_ID = 'main_store';
export const PRODUCTS_COL = 'products';
export const ORDERS_COL = 'orders';
export const CITIES_COL = 'cities';
export const APARTMENTS_COL = 'apartments';
export const BANNERS_COL = 'banners';
export const INTAKES_COL = 'intakes';
