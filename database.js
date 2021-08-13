import {SQLite, openDatabase} from 'react-native-sqlite-storage';


const database_name = 'iseries.db';
const database_version = '1.0';
const database_displayname = 'SQLite React Offline Database';
const database_size = 200000;
const tableName = 'Series';

export const getDBConnection = async () => {
  console.log('Getting DB Connection');
  let db = openDatabase(
    database_name,
    database_version,
    database_displayname,
    database_size,
  );
  console.log('Got DB');
  return db;
};

export const createTable = async (db: SQLiteDatabase) => {
  // create table if not exists
  const query = `CREATE TABLE IF NOT EXISTS ${tableName}(
        name TEXT NOT NULL,
        description TEXT
    );`;

  await db.executeSql(query);
};

export const getSeries = async (db: SQLiteDatabase): Promise<Series[]> => {
  try {
    const series: Series[] = [];
    const results = await db.executeSql(
      `SELECT rowid as id, name FROM ${tableName}`,
    );
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        series.push(result.rows.item(index));
      }
    });
    return series;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get todoItems !!!');
  }
};

export const saveSeries = async (db: SQLiteDatabase, series: Series[]) => {
  const insertQuery =
    `INSERT OR REPLACE INTO ${tableName}(rowid, name) values` +
    series.map(i => `(${i.id}, '${i.name}')`).join(',');

  return db.executeSql(insertQuery);
};

export const deleteTodoItem = async (db: SQLiteDatabase, id: number) => {
  const deleteQuery = `DELETE from ${tableName} where rowid = ${id}`;
  await db.executeSql(deleteQuery);
};

export const deleteTable = async (db: SQLiteDatabase) => {
  const query = `drop table ${tableName}`;

  await db.executeSql(query);
};

export type Series = {
  id: number,
  name: string,
};
