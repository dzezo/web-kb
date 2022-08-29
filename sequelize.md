# Sequelize

1. [Introduction and Connection to a Database](#1)
2. [Models](#2)
3. [Model Instances](#3)
4. [Model Querying](#4)
5. [Finder Methods](#5)
6. [Getters, Setters and Virtual Fields](#6)
7. [Validators and Constraints](#7)
8. [SQL Injection and Raw Queries](#8)
9. [Paranoid Tables](#9)
10. [Associations](#10)

<div id="1">

# What is sequelize

Sequelize is ORM (Object Relational Mapper). ORM is a programming technique to write datebase queries in an object-oriented way using your preffered programming language. In simple terms Sequelize lets you write SQL queries in JS, examples bellow are SQL queries and their JS equivalents:

### Example 1

```SQL
SELECT * FROM users
```

```JS
Users.findAll();
```

### Example 2

```SQL
INSERT INTO users (username, password, age) VALUES ('name', 'pass', 25)
```

```JS
Users.create({
  username: 'name',
  password: 'pass',
  age: 25
})
```

### Example 3

```SQL
SELECT password FROM users WHERE username = 'name' LIMIT 1
```

```JS
Users.findOne({
  where: {
    username: 'name'
  }
})
```

### Example 4

```SQL
SELECT * FROM users WHERE age = 25 OR age = 37
```

```JS
Users.findAll({
  where: {
    [Op.or]: [{age: 25}, {age: 37}]
  }
})
```

## Connection

When installing sequelize you also need to install driver that correspons to the database you will be connecting to, once you install everything you can start your connection, example below:

```JS
const Sequelize = require('sequelize'); // you don't have to require driver for your db, this does that for you

const sequelize = new Sequelize('db_name', 'db_username', 'db_password', {
  host: db_host, // default is 'localhost'
  port: db_port, // default depends on dialect for mysql it is 3306
  dialect: 'mysql',
  define: {
    freezeTableName: true // You can do this to prevent pluralization of table names on a whole DB scale
  }
})

// To start connection use authenticate function
// This function returns promise
sequelize.authenticate().then(() => {
  console.log('Connection successful!");
}).catch((err) => {
  console.log('Error connecting to database');
})
```

<div id="2">

# Models

Models are used to represent tables. To create a table we use define method

```JS
const User = sequelize.define('user', {
  user_id: {
    type: Sequalize.DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false, // It neeeds to have a value
  },
  password: {
    type: Sequelize.DataTypes.STRING
  },
  age: {
    type: Sequelize.DataTypes.INTEGER,
    defaultValue: 21,
  }
}, {
  freezeTableNAme: true, // Sequelize will by default pluralize name of the table this option will prevent it
})
```

Some of sequelize data types are:

```
STRING:       VARCHAR(255)
TEXT:         TEXT
BOOLEAN:      TINYINT(1)
INTEGER:      INTEGER
FLOAT:        FLOAT
STRING(1234): VARCHAR(1234)
DATE:         DATE
```

In order to insert table we need to use sync method. Sync method will create a table if it doesn't exist, or it wouldn't do anything. If you call sync functions like `sync({ force: true })` then it would drop table if it already exists and create a new one. Another option is to call this function with `sync({ alter: true })` in this case it would perform necessary changes in the table to make it match the model.

```JS
User.sync({ alter: true }).then(() => {
  console.log("Table and model synced successfully!");
}).cathc((err) => {
  console.log("Error syncing the table and model!");
});
```

You can drop multiple table with sequalize by using drop() method. You can also pass optional regex param to tell sequalize which tables you want to drop, example:

```JS
// This will drop any table that ends in _test
sequelize.drop({ match: /_test$/ })
```

```JS
// Regex reminder
{ match: /abc/i }  // Look for abc in a case insensitive way
{ match: /[h]/g }  // Look for all occurences of the letter h
{ match: /[h]/  }  // Look for first occurence of the letter h and then stop
{ match: /\d/g  }  // Find all occurences of  digits
```

**sync** and **drop** are not recommended for production level software, synchronization should be done with migrations!

<div id="3">

# Model Instances

## Inserting data with build and save

- **_Build method_** is used to build the object that can be inserted in a table, and it is executed **immediately**.
- **_Save method_** is used to save object that we've built, and this method is **async**.

```JS
User
.sync({ alter: true })
.then(() => {
  // working with our updated table.
  const user = User.build({
    username: 'name1',
    password: 'pass1',
    age: 25
  });

  return user.save(); // this will return a promise
})
.then((data) => {
  console.log("User added to database!");
  console.log(data.toJSON()); // This will print inserted data
})
.catch((err) => {
  console.log(err)
})
```

Since this can be tedious there's a method that combines these two methods into one called **create**, example below is equivalent:

```JS
return User.create({
  username: 'name1',
  password: 'pass1',
  age: 25
})
```

## Deleting data

If you want to delete some data you can use **.destroy()** method, and if you want to restore original data you can use **.reload()**.

## Saving data

You can even save specific fields to database you just need to specify array of fields that you want to save, example:

```JS
data.username = "name2";
data.age = 30;
return data.save({ fields: ['age'] });
```

The way sequelize works is that it only saves fields that have been changed, if we would to just do .save(), sequelize would only save username and age, even though there is a password field as well.

## Incrementing and Decrementing data

```JS
data.increment({ age: 2 })
data.decrement({ age: 2 })
```

You can increment or decrement multiple fields at once for example:

```JS
data.increment({ age: 1, height: 1 })
```

## Bulk create

You can also create multiple object at once by using method called **bulkCreate** that takes array of objects, example:

```JS
User.bulkCreate([{
  username: 'name1',
  password: 'pass1',
  age: 25
},{
  username: 'name2',
  password: 'pass2',
  age: 26
}])
```

One thing to note about bulkCreate is that it **doesn't run validation** on each object that it creates, example of validation below:

```JS
username: {
  type: DataType.STRING,
  allowNull: false,
  validate: {
    len: [4, 6] // What we are inserting needs to pass this to be allowed
  }
}
```

bulkCreate on it's own is not going to run validation, you need to specify that option by adding:

```JS
{ validate: true }
```

,of course this will decrease performance.

<div id="4">

# Model Querying

Selecting all entries from table:

```SQL
SELECT * FROM 'users' AS 'users'
```

```JS
Users.findAll()
```

Selecting specific columns from table:

```SQL
SELECT username, password FROM users AS users
```

```JS
findAll({
  attributes: ['username', 'password']
})

// We can also exclude certain columns by using exclude property, example:
findAll({
  attributes: {
    exclude: ['password']
  }
})

```

Selecting specific columns from table and giving them some alias:

```SQL
SELECT username AS myName, password AS myPass FROM users AS users
```

```JS
findAll({
  attributes: [
    ['username', 'myName'],
    ['password', 'myPass']
  ]
});
```

## Using aggregation functions:

```SQL
SELECT SUM('age') AS howOld from users AS users
```

```JS
findAll({
  attributes: [
    [sequelize.fn('SUM', sequelize.col('age')), 'howOld']
  ]
})
```

Selecting with filter condition

```SQL
SELECT * FROM users AS users WHERE users.username == "name1"
```

```JS
findAll({
  where: { username: "name1" }
})
```

To limit the amount of returned row we can do:

```JS
findAll({ limit: 2 })
```

## Ordering and Grouping

```JS
User.findAll({ order: [['age', 'DESC']] })
User.findAll({
    attributes: [
        'username',
        [sequelize.fn('SUM', sequelize.col('age')), 'sum_age']
    ],
    group: 'username'
})
```

## Operators

```JS
const { Op } = Sequelize;

findAll({
  where: {
    [Op.or]: { username: 'soccer', age: 45 }
  }
})
```

Default behavior of where is <code>[Op.and]</code>, so

```JS
{ where: { username: 'soccer', age: '45' }}
```

translates into:

```SQL
users.username == soccer and users.age == 45
```

```JS
findAll({
  where: {
    age: {
      [Op.gt]: 25
    }
  }
})
```

```SQL
SELECT * FROM users AS users WHERE users.age < 45 OR users.age IS NULL
```

```JS
findAll({
  where: {
    age: {
      [Op.or]: {
        [Op.lt]: 45,
        [Op.eq]: null
      }
    }
  }
})
```

You can use **sequelize.fn** within where clause, but you need to use **sequelize.where**

```JS
findAll({
  where: sequelize.where(
    sequelize.fn('char_length', sequelize.col('username')), 6
  )
})
```

You can use querying to update or destroy

```JS
User.update(
  { username: 'pizza' },
  {
    where: { age: 25 }
  }
)
```

```JS
User.destroy({ where: { username: "pizza" }});
User.destroy({ truncate: true }); // Deletes every row in a table, but doesn't delete table itself
```

## Utility methods

```JS
User.max('age')
User.sum('age', { where: { age: 21 }}) // gives a age sum of all users that are 21 yrs old
```

<div id="5">

# Finder Methods

<div id="6">
<div id="7">
<div id="8">
<div id="9">
<div id="10">
