# Sequelize

1. [Introduction and Connection to a Database](#1)
2. [Models](#2)

<div id="1">

## What is sequelize

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

## Models

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
