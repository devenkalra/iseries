import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {SQLite, openDatabase} from 'react-native-sqlite-storage';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import * as ImagePicker from 'react-native-image-picker';

var RNFS = require('react-native-fs');

const database_name = 'iseries.db';
const database_version = '1.0';
const database_displayname = 'SQLite React Offline Database';
const database_size = 200000;
const tableName = 'Series';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

class DbFuncs {
  constructor(props) {
    this.db = openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size,
    );
    this.createTables();
  }

  executeSql(query, pmts, func) {
    console.log("Executing Sql");
    return new Promise((resolve, reject) => {
      this.db.executeSql(query, pmts, (results) => {
        // eslint-disable-next-line no-undef
        console.log("ES=" + JSON.stringify(results))
        func(resolve, reject, results);
      });
    });
  }

  async createTables() {
    // create table if not exists
    console.log('Creating Table');
    let tables = await this.getTableNames();
    console.log('Tablex=' + JSON.stringify(tables));

    if (!tables.includes('Series')) {
      const query = `CREATE TABLE IF NOT EXISTS Series
                     (
                         id          INTEGER PRIMARY key,
                         name        TEXT NOT NULL,
                         description TEXT
                     );`;
      await this.executeSql(query);
    }
    if (!tables.includes('Images')) {
      const query = `CREATE TABLE IF NOT EXISTS Images
                     (
                         id          INTEGER PRIMARY key,
                         name        TEXT NOT NULL,
                         uri         TEXT NOT NULL,
                         description TEXT
                     );`;
      await this.executeSql(query);
    }
    if (!tables.includes('SeriesImages')) {
      const query = `CREATE TABLE IF NOT EXISTS SeriesImages
                     (
                         id          INTEGER PRIMARY key,
                         series_id   INTEGER,
                         image_id    INTEGER,
                         description TEXT
                     );`;
      await this.executeSql(query);
    }
    const AppFolder = 'imgs';
    const DirectoryPath = RNFS.ExternalStorageDirectoryPath + '/' + AppFolder;
    RNFS.mkdir(DirectoryPath);
    /*
    if (!tables.includes('Images')) {
      const query = `CREATE TABLE IF NOT EXISTS Images
                     (
                         id          INTEGER PRIMARY key,
                         path        TEXT NOT NULL,
                         description TEXT
                     );`;
      db.executeSql(query);
     */
    console.log('DBType=' + typeof db);
  }

  getTableNames() {
    console.log('Show Tables');
    let tables = [];
    try {
      return this.executeSql(
        `SELECT name
             FROM sqlite_master
             WHERE type = 'table'
               AND name NOT LIKE 'sqlite_%'`,
        [],
        (resolve, reject, result) => {
          JSON.stringify("A="+result);
          console.log('Found Tables' + JSON.stringify(result));
          tables = [];
          try {
            for (let index = 0; index < result.rows.length; index++) {
              console.log(JSON.stringify(result.rows.item(index)));
              tables.push(result.rows.item(index).name);
            }
          } catch (e) {
            console.log(e.message);
          }
          console.log('Found Tables' + JSON.stringify(result));
          resolve(tables);
        },
      );
    } catch (e) {
      console.log('error=' + e.message);
      return null;
    }
  }

  insertNewSeries(name, description = '', func) {
    console.log('Inserting Series' + name);
    this.db.executeSql(
      `INSERT Into Series (name, description)
         VALUES (?, ?)`,
      [name, description],
      func,
    );
  }

  getSeriesList(func) {
    dbFuncs.db.executeSql(
      `SELECT rowid as id, name, description
         FROM Series`,
      [],
      result => {
        let series = [];
        console.log('S= ' + JSON.stringify(series));
        console.log('R=' + JSON.stringify(result));
        try {
          for (let index = 0; index < result.rows.length; index++) {
            series.push(result.rows.item(index));
          }
        } catch (e) {
          console.log(e.message);
        }
        func(series);
      },
    );
  }

  deleteSeries(id, func) {
    dbFuncs.db.executeSql(
      `DELETE FROM Series WHERE rowid == ${id}`,
      [],
      result => {
        func();
      },
    );
  }

  addImageToSeries(series_id, file) {
    console.log('DB: Adding:' + series_id + ' ' + JSON.stringify(file));
    try {
      this.db.executeSql(
        `INSERT INTO Images (name, uri)
           VALUES (file.fileName, file.uri)`,
        [],
        (tx, results) => {
          console.log('Results', JSON.stringify(results));
          if (results.rowsAffected > 0) {
            console.log('Data Inserted Successfully....');
          } else {
            console.log('Failed....');
          }
        },
      );
    } catch (e) {
      console.log('Error');
      console.log(e.message);
    }
    console.log('DOne Adding');
  }

  getSeries(id, func) {
    console.log('Getting series for id ' + id);
    dbFuncs.db.executeSql(
      `SELECT rowid as id, name, description
         FROM Series WHERE rowid == ${id}`,
      [],
      result => {
        let series = [];
        console.log('S1=' + JSON.stringify(series));
        console.log(result);
        try {
          for (let index = 0; index < result.rows.length; index++) {
            series.push(result.rows.item(index));
          }
        } catch (e) {
          console.log(e.message);
        }
        func(series);
      },
    );
  }
}

const getSeries = async db => {
  try {
    const series = [];
    const results = await db.executeSql(
      `SELECT rowid as id, name FROM ${tableName}`,
    );
    console.log(results);
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        series.push(result.rows.item(index));
      }
    });
    return series;
  } catch (error) {
    console.error(error.message);
    throw Error('Failed to get todoItems !!!');
  }
};

let db;

let dbFuncs = new DbFuncs();

async function db_init() {
  const db = await getDBConnection();
  if (db == undefined) {
    console.error('db is undefined');
  } else {
    console.log('DB is defined');
  }
  await createTable(db);
  return;
}

/*
(async () => {
  const db = await getDBConnection();
  alert(JSON.stringify(db));
  await createTable(db);
  const series = await getSeries(db);
  alert(JSON.stringify(series));
})().then(function(x){return x}).catch(function(err){throw err;});
*/
/*
function HomeScreen({navigation, route}) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Home Scdreen</Text>
      <Button
        title="Go to Details"
        onPress={() => {
          // 1. Navigate to the Details route with params
          navigation.navigate('Details', {
            itemId: 86,
            otherParam: 'anythidng you want here',
          });
        }}
      />
      <Button
        title="Create post"
        onPress={() => navigation.navigate('CreatePost')}
      />
      <Text style={{margin: 10}}>Post: {route.params?.post}</Text>
    </View>
  );
}
*/
const options = {
  DB: {
    title: 'DB',
    headerStyle: {
      backgroundColor: '#f4511e',
    },
    footerStyle: {
      backgroundColor: '#f4511e',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  },
  seriesList: {
    title: 'Series List',
    headerRight: () => (
      <Button
        onPress={() => alert('This is a dbutton!')}
        title="Info"
        color="#ff0"
      />
    ),
    headerStyle: {
      backgroundColor: '#f4511e',
    },
    footerStyle: {
      backgroundColor: '#f4511e',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  },
  seriesDetail: {
    title: 'Series Detail',
    headerRight: () => (
      <Button
        onPress={() => alert('This is a button!')}
        title="Info"
        color="#ff0"
      />
    ),
    headerStyle: {
      backgroundColor: '#f4511e',
    },
    footerStyle: {
      backgroundColor: '#f4511e',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  },
};
const COLORS = {
  primaryDark: '#22212c',
  primaryLight: '#f8f8f2',
  primaryRed: '#ff5555',
  primaryPink: '#ff80bf',
  primaryYellow: '#ffff80',
  primaryOrange: '#ff9580',
};
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  item: {
    backgroundColor: '#f9c2ff',
    padding: 5,
    height: 80,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  horizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 32,
  },
  listcontainer: {
    flex: 1,
    backgroundColor: '#777',
    marginTop: 30,
  },
});

const DATA = [
  {
    id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
    title: 'Flower',
  },
  {
    id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
    title: 'Skin Condition',
  },
];

var isNewResult = false;

function DbScreen({route, navigation}) {
  const [newDbResult, setNewDbResult] = useState('');

  function showTables() {
    console.log('Show Tables');
    try {
      dbFuncs.db.executeSql(
        `SELECT name
           FROM sqlite_master
           WHERE type = 'table'
             AND name NOT LIKE 'sqlite_%'`,
        [],
        result => {
          console.log('Listing Tables');
          let series = [];
          console.log('S1= ' + JSON.stringify(series));
          console.log('RST=' + JSON.stringify(result));
          try {
            for (let index = 0; index < result.rows.length; index++) {
              console.log('index=' + index);
              console.log('Item ST=' + JSON.stringify(result.rows.item(index)));
              series.push(result.rows.item(index));
            }
          } catch (e) {
            console.log(e.message);
          }
          setNewDbResult('T=' + JSON.stringify(series));
        },
      );
    } catch (e) {
      console.log('error=' + e.message);
    }
  }

  function showRecords() {
    dbFuncs.insertNewSeries('Another');
    dbFuncs.getSeriesList(series => setNewDbResult(JSON.stringify(series)));
  }

  return (
    <SafeAreaView>
      <View style={styles.buttonContainer}>
        <TextInput />
        <Text>{newDbResult}</Text>
        <Button
          title="Execute"
          onPress={() => {
            showTables();
            showRecords();
          }}
        />
        <Button
          title="Main"
          onPress={() => navigation.navigate('SeriesList')}
        />
      </View>
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <Button
            title="Add Series"
            onPress={() => navigation.navigate('AddSeries')}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Button 2" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function SeriesListScreen({route, navigation}) {
  const [series, setSeries] = useState(null);
  let reload = false;
  if (route.params) {
    reload = route.params.reload;
    if (reload) {
      route.params.reload = false;
      setSeries(null);
    }
  }
  useEffect(() => {
    if (series === null) {
      dbFuncs.getSeriesList(series => setSeries(series));
    }
  });
  console.log(JSON.stringify(arguments));

  const Item = ({title, id, subtitle}) => (
    <View style={styles.item}>
      <View>
        <Text style={{fontSize: 32, paddingRight: 5}}>H</Text>
      </View>
      <View style={{width: '80%'}}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={{marginTop: 10, marginBottom: 'auto'}}>
        <Button
          title={'>'}
          onPress={() => {
            navigation.navigate('SeriesDetail', {
              itemId: {id},
            });
          }}
        />
      </View>
    </View>
  );
  const renderItem = ({item}) => (
    <Item title={item.name} id={item.id} subtitle={item.id} />
  );
  if (series == null) {
    return null;
  }
  console.log(JSON.stringify(series));
  return (
    <SafeAreaView>
      <FlatList
        data={series}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
      <View style={styles.buttonContainer}>
        <Button
          title="Add Series"
          onPress={() => navigation.navigate('AddSeries')}
        />
        <Button
          title="Db Screen"
          onPress={() => navigation.navigate('DbFuncs')}
        />
      </View>
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <Button
            title="Add Series"
            onPress={() => navigation.navigate('AddSeries')}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Button 2" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function SeriesDetailScreen({route, navigation}) {
  const [series, setSeries] = useState(null);
  const [id, setItemId] = useState(null);
  useEffect(() => {
    const itemId = route.params.itemId.id;
    console.log('id=' + JSON.stringify(itemId));
    if (series === null) {
      setItemId(itemId);
      dbFuncs.getSeries(itemId, series => {
        console.log(JSON.stringify(series));
        setSeries(series[0]);
      });
    }
  });
  console.log('Series Detail');
  if (series === null) {
    return null;
  }
  console.log('Series is:' + JSON.stringify(series));

  return (
    <SafeAreaView>
      <Text>Detail for Series for {series.name}</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Delete"
          onPress={() => {
            dbFuncs.deleteSeries(id, () =>
              navigation.navigate('SeriesList', {reload: true}),
            );
          }}
        />
        <Button
          title="Add Image"
          onPress={() => {
            console.log(JSON.stringify(series));
            navigation.navigate('AddImage', {series});
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function AddSeriesScreen({route, navigation}) {
  const [text, setText] = useState('');

  return (
    <SafeAreaView>
      <Text style={styles.title}>Add Series</Text>
      <View style={styles.horizontal}>
        <Text>Name: </Text>
        <TextInput
          style={{height: 40}}
          placeholder="Name!"
          onChangeText={text => setText(text)}
          defaultValue={text}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title={'Create'}
          onPress={() =>
            dbFuncs.insertNewSeries(text, '', () =>
              navigation.navigate('SeriesList', {reload: true}),
            )
          }>
          }>
        </Button>
      </View>
    </SafeAreaView>
  );
}

function AddImageScreen({route, navigation}) {
  const [imageSource, setImageSource] = useState(null);
  const [series, setSeries] = useState(null);
  useEffect(() => {
    console.log('R=' + JSON.stringify(route.params));
    setSeries(route.params.series);
  });

  function selectImage() {
    console.log('Selecting Image');
    let options = {
      title: 'You can choose one image',
      maxWidth: 256,
      maxHeight: 256,
      storageOptions: {
        skipBackup: true,
      },
    };

    ImagePicker.showImagePicker(options, response => {
      console.log({response});

      if (response.didCancel) {
        console.log('User cancelled photo picker');
        //Alert.alert('You did not select any image');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        let source = {uri: response.uri};
        console.log({source});
      }
    });
  }

  if (series == null) {
    return null;
  } else {
    return (
      <View
        style={[
          styles.flex,
          styles.centerContainer,
          {backgroundColor: COLORS.primaryDark},
        ]}>
        <Text style={[styles.title, {color: COLORS.primaryLight}]}>
          {series.name}
        </Text>
        <Text style={[styles.title, {color: COLORS.primaryLight}]}>
          Image Picker
        </Text>
        <TouchableOpacity
          onPress={selectImage}
          style={[
            styles.selectButtonContainer,
            {backgroundColor: COLORS.primaryLight},
          ]}>
          <Text style={styles.selectButtonTitle}>Pick an image</Text>
          <Button
            onPress={() =>
              ImagePicker.launchImageLibrary(
                {
                  mediaType: 'photo',
                  includeBase64: false,
                  maxHeight: 200,
                  maxWidth: 200,
                },
                response => {
                  console.log('S1=' + JSON.stringify(response));
                  dbFuncs.addImageToSeries(series.id, response.assets[0]);
                },
              )
            }
            title="Select Image"
          />
        </TouchableOpacity>
      </View>
    );
  }
}

function CreatePostScreen({navigation, route}) {
  const [postText, setPostText] = React.useState('');

  return (
    <>
      <TextInput
        multiline
        placeholder="What's odn your mind?"
        style={{height: 200, padding: 10, backgroundColor: 'white'}}
        value={postText}
        onChangeText={setPostText}
      />
      <Button
        title="Done"
        onPress={() => {
          // Pass and merge params back to home screen
          navigation.navigate({
            name: 'Home',
            params: {post: postText},
            merge: true,
          });
        }}
      />
    </>
  );
}

const Stack = createNativeStackNavigator();

function LogoTitle() {
  return <Text> Title Here</Text>;
}

var setDBResult;

function App() {
  const [seriesList, setSeriesList] = useState(null);
  useEffect(() => {
    if (seriesList === null) {
      dbFuncs.getSeriesList(series => setSeriesList(series));
    }
  });

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="DbFuncs"
          component={DbScreen}
          options={options.DB}
        />

        <Stack.Screen
          name="SeriesList"
          component={SeriesListScreen}
          options={options.seriesList}
        />

        <Stack.Screen
          name="AddSeries"
          options={{title: 'Add Series'}}
          component={AddSeriesScreen}
        />
        <Stack.Screen
          name="AddImage"
          options={{title: 'Add Image'}}
          component={AddImageScreen}
        />
        <Stack.Screen
          name="SeriesDetail"
          options={options.seriesDetail}
          component={SeriesDetailScreen}
        />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
