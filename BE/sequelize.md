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
11. [Migrations](#11)

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

Sequelize model instance is essentially a row in a table/model, to view values stored in a row you can use method `toJSON()`.

Example below will yield the same result as using `data.toJSON()`

```js
sync()
  .then(() => {
    return User.findAll({ raw: true });
  })
  .then((data) => {
    console.log(data);
  });
```

**_findByPk_** - Finding row by primary key

```js
findByPk(28);
```

**_findOne_** - Return the first row that matches the condition

```js
findOne(); // This will return first row
findOne({
  where: {
    age: {
      [Op.or]: {
        [Op.lt]: 25,
        [Op.eq]: null,
      },
    },
  },
});
```

**_findOrCreate_** - Create a row in a table if it can't find one, this functions returns an array of instance and a boolean. Boolean is signaling whether instance is found or created, boolean is true if instance was created.

```js
findOrCreate({
  where: { username: "name2" },
  defaults: {
    age: 30, // Overrides defaults enforced by model
  },
});
```

**_findAndCountAll_** - This method combines findAll and Count

```js
sync()
  .then(() => {
    return User.findAndCountAll({
      where: { username: "name" },
      raw: true,
    });
  })
  .then((data) => {
    const { count, rows } = data;
  });
```

<div id="6">

# Getters, Setters and Virtual Fields

## Getters & Setters

```js
const User = sequelize.define(
  "user",
  {
    user_id: {
      type: Sequalize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false, // It neeeds to have a value
      get() {
        // This function is called automatically whenever field value is read
        // for example when we do user.username

        const rawValue = this.getDataValue("username");

        // We use this.getDataValue('username') instead of this.username
        // because this.username will call get() and we will get infinitive loop

        // Whenever we retrieve user we are going to capitalize username
        return rawValue.toUpperCase();
      },
    },
    password: {
      type: Sequelize.DataTypes.STRING,
      set(value) {
        // value is value that is about to be stored into DB
        // to insert we use setDataValue(col_name, value)

        // setters and getters only deal with sync code so we are going to use sync bcrypt
        const salt = bcrypt.genSaltSync(12);
        const hash = bcrypt.hashSync(value, salt);

        this.setDataValue("password", hash);
      },
    },
    age: {
      type: Sequelize.DataTypes.INTEGER,
      defaultValue: 21,
    },
  },
  {
    freezeTableNAme: true, // Sequelize will be default pluralize name of the table this option will prevent it
  }
);
```

## Virtual fields

Fields that sequelize populates under the hood but are not stored in DB, common use is to combine different attributes

```js
aboutUser: {
  type: DataType.VIRTUAL, // This will not create column in DB
  get() {
    return `${this.username}: ${this.description}`
  }
}
```

<div id="7">

# Sequelize - Validators and Constraints

```js
email: {
  type: DataType.STRING,
  unique: true, // ensures that this value is unique
  validate: {
    // built-in validator functions
    isEmail: true,
    isIn: ['email1@email.com', 'email2@email.com'], // If email is not included in this array it will throw an error
  }
}

age: {
  type: DataType.INTEGER,
  validate: {
    // custom validator
    isOldEnough(value) {
      if (value < 21) throw new Error('Too young');
    }
  }
}

age: {
  type: DataType.INTEGER,
  validate: {
    // This is built-in validator, and we are overriding error message
    isNumeric {
      msg: "You must enter a number for age."
    }
  }
}

email: {
  type: DataType.STRING,
  unique: true, // ensures that this value is unique
  validate: {
    isIn: {
      args: ['email1@email.com', 'email2@email.com'],
      msg: 'The provided must be one of the following...'
    }
  }
}
```

If you use `allowNull: true` constraint on a column (**which is default**) then built-in validatiors will not run, but custom ones will.

This validators are column wide, we can specify model wide validation. This validation will run after all column validations.

```js
const User = sequelize.define(
  "user",
  {
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
      type: Sequelize.DataTypes.STRING,
    },
    age: {
      type: Sequelize.DataTypes.INTEGER,
      defaultValue: 21,
    },
  },
  {
    freezeTableNAme: true,
    validate: {
      usernamePassMatch() {
        if (this.username == this.password)
          throw new Error("Password cannot be your username!");
      },
    },
  }
);
```

<div id="8">

# Sequelize - SQL Injection and Raw Queries

Sequelize allows us to write raw queries with query() method, which returns result and metadata (how many rows where affected etc.).

```js
sync()
  .then(() => {
    return sequelize.query(`UPDATE user SET age = 54 WHERE username = 'name1'`);
  })
  .then((data) => {
    [result, metadata] = data;
    console.log(result);
    console.log(metadata);
  });
```

```js
// This will tell sequelize what type of query are we running
// In case of SELECT type metadata is going to be omitted
sequelize.query("SELECT * FROM user", { type: QueryTypes.SELECT });
```

## SQL Injection

Whenever we are using raw queries SQL Injection might occur, example:

```js
// unsafe
query(
  `SELECT username FROM users WHERE username = ${username} AND password = ${password}`
);

// safe
query(`SELECT username FROM users WHERE username = ? AND password = ?`, {
  replacement: [username, password],
});

// We can pass replacements as object
query(
  `SELECT username FROM users WHERE username = :username AND password IN (:passwords)`,
  {
    replacement: {
      username: "username1",
      passwords: ["admin", "12345"],
    },
  }
);

// We can also pass wildcards
query(`SELECT username FROM users WHERE username LIKE :username`, {
  replacement: {
    username: "u%", // username starts with u, and ends with whatever
  },
});
```

## Bind Parameters

Replacements are preventing SQL Injections by escaping inputs, Bind Parameters send SQL statement and DATA to DB Server separately, so even if SQL statement is provided as DATA it would still be treated as DATA and it will not get executed.

```js
// Notice array is one-based
query(`SELECT username FROM users WHERE username = $1 AND password = $2`, {
  bind: [username, password],
});

query(
  `SELECT username FROM users WHERE username = $username AND password = $passwords)`,
  {
    bind: {
      username: "admin",
      passwords: "admin",
    },
  }
);
```

<div id="9">

# Sequelize - Paranoid Tables

This is a table where records are deleted but not truly deleted, instead column named **deleted_at** has a timestamp of deletion request, think of it as a soft deletion. In order to create such table you need to add option `{ paranoid: true }` to model `define()`

```js
const User = sequelize.define(
  "user",
  {
    user_id: {
      type: Sequalize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    // In order to create paranoid table we need to have both of this flags set to true
    paranoid: true,
    timestamp: true,
  }
);
```

In order to hard delete something from paranoid table we need to use `{ force: true }`

```js
User.destroy({
  where: { user_id: 27 },
  force: true,
});
```

Good thing about paranoid table is that you can use restore method to "restore" data, this is essentially writing nulls to deleted_at column.

```js
User.restore({
  where: { user_id: 27 },
});
```

One thing to mention whenever we are selecting rows from paranoid table sequelize will automatically ignore rows where deleted_at has some value, this is not true if we are using raw queries.

But if we want to get "deleted" row with sequelize we can use `{ paranoid: false }` as an option for our select method, example:

```js
User.findOne({ paranoid: false });
```

<div id="10">

# Sequelize - Associations

Associations are relationships between tables in DB, these relationships are established with FK. FK is when the PK from parent table appears in child table. Child table is table with FK, meaning it is useless on its own. There are 3 types of associations:

1. One to one
2. One to many
3. Many to many

## One to one

This is association where PK from parent table appears in FK column on child table at most once.

An example would be country and its capital city, every country can have one capital city, and city can be capital of only one country.

```js
const Country = sequelize.define(
  "country",
  {
    countryName: {
      type: DataTypes.STRING,
      unique: true,
    },
  },
  {
    timestamps: false,
  }
);

const Capital = sequelize.define(
  "capital",
  {
    capitalName: {
      type: DataTypes.STRING,
      unique: true,
    },
  },
  {
    timestamp: false,
  }
);
```

To create one to one relationship in sequelize we can use one of two methos `hasOne()` or `belongsTo()`

```js
Country.hasOne(Capital); // this will automatically add countryId to capitals table as FK
```

The way sequelize did this is by taking name of PK key which is id by default and prepending name of the model which is country thus giving countryId. This of course can be customized.

```js
Country.hasOne(Capital, { foreignKey: "custom_fk_name" });
```

### Linking records with **hasOne** helper method

Because we used hasOne method we got following helper methods that we can use:

1.  getCapital
2.  setCapital
3.  createCapital

```js
let country, capital;

capital = await Capital.findOne({ where: { capitalName: "Madrid" } });
country = await Country.findOne({ where: { countryName: "Spain" } });

await country.setCapital(capital); // This is how to link those two together
```

If we want to find what is capital of some country we can use get method to do this

```js
country = await Country.findOne({ where: { countryName: "Spain" } });
capital = await country.getCapital(); // This is how we get 'Madrid'
```

If we want to create capital while we are creating country we can do it in following manner:

```js
country = await Country.create({ countryName: "USA" });
await country.createCapital({ capitalName: "Washington, D.C." });
```

**belongsTo** does the same thing as hasOne so writing Capital.belongsTo(Country) will yield the same exact result as Country.hasOne(Capital) in DB,

belongsTo of course returns different helper methods like setCountry, getCountry, and createCountry.

It is a good practice to use both of them because helper methods will get attached to source model and then you can conveniently use it.

One thing to mention when you are using this association method you can customize foreignKey column like you would do with any other column during model definition, example:

```js
County.hasOne(Capital, {
  foreignKey: {
    name: "custom_name",
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
// And you need to repeat this in your belongsTo method.
```

hasOne and belongsTo have additional trigger options like onDelete and onUpdate.

```js
County.hasOne(Capital, {
    onDelete: 'CASCADE' // if we delete a country delete all child rows associated with it will be removed
    onUpdate: 'CASCADE' // this will update every row in child table that is associated
})

// for example this will delete 'Madrid' row as well
Country.destroy({ where: { countryName: 'Spain' }})
```

One thing to mention is that **hasOne is exclusive to one-to-one while belongsTo is not** and it can be used with one-to-many relationships, which means that you can use `capital.setCountry(country)` and set two different capitals to point to the same country.

## One to Many

Association where PK from parent table may appear in FK column on child table more then once, example would be user and posts, meaning one user can have many posts. Methods for this type of association are hasMany and belongsTo.

```js
User.hasMany(Post);
```

One of helper methods that gets attached to User model is `addPosts`

```js
const user = await User.findOne({ where: { username: "name1" } });
const posts = await Post.findAll();

// This will make that all FK in posts table are going to point to 'name1' user
await user.addPosts(posts);
```

We can user another helper method provided called `countPosts`

```js
// This will return how many posts belong to 'name1'
await user.countPosts();
```

There are remove helpers like removePost and removePosts, example:

```js
const post = await Post.findOne();
user.removePost(post); // this will set userId FK column to NULL
```

if we want to delete all posts related to user once we delete user we do this by specifing `{ onDelete: 'CASCADE' }`

```js
User.hasMany(Post, { onDelete: "CASCADE" });
```

## Many to Many

Association where a child table (join table) contains two FK columns referencing the PK column of the two parent tables. Example would be Customer and Product, Customer can purchase many products, and product can be purchased by many customers.

Here we have two main tables Product and Customers with their PKs and join table that holds their PKs.

Since relational DBs do not provide you with a way to directly implement many-to-many relationship, the way we do it is by creating multiple one-to-many relationships and storing them in extra table called junction model.

Implementation of many-to-many

```js
Customer.belongsToMany(Product, {
  through: 'customerproduct' // junction table, this is requried
  foreignKey: 'customer_id'
})
Product.belongsToMany(Customer, {
  through: 'customerproduct',
  foreignKey: 'product_id'
})
```

By passing a string to through above, we are asking Sequelize to automatically generate a model named `customerproduct` as the through table (also known as junction table), with only two columns: `customer_id` and `product_id`. A composite unique key will be established on these two columns.

We create junction table ourselves

```
const CustomerProduct = sequelize.define({}, { timestamps: false })

Customer.belongsToMany(Product, {
    through: CustomerProduct // we are passing model instead of a string
})
Product.belongsToMany(Customer, {
    through: CustomerProduct
})
```

The above has the exact same effect. Note that we didn't define any attributes on the `CustomerProduct` model. The fact that we passed it into a belongsToMany call tells sequelize to create the two attributes `customerId` and `productId` automatically.

Defining the model by ourselves has several advantages. We can, for example, define more columns on our through table.

Helper methods provided by belongsToMany are exact same as those provided by hasMany. As for onDelete and onUpdate default value is **CASCADE** so we don't need to explicitly specify that.

<div id="11">

# Sequelize migrations

Let's say we have a table and we want to change name of a column and perserve data while we do so then we have to perform DB migrations.

First step is to change model definition, this will not change database unless we drop it. If we have somewhere within our project sync({ force: true }) in that case DB will get dropped and changes will be visible.

Install sequelize cli `npm i -g sequelize-cli`

`sequelize init` will create config.json, that config file represents DB credentials, you can change config.json to .js and pass credentials from .env which is usefull for other types of environments like staging and production.

`sequelize init:migrations` this will create migrations folder

`sequelize migration:generate --name [migration-name]` this will create new migration file that will be named something like `[timestamp]-[migration-name].js`. This file will export an object that contains two functions `up` and `down`.

Logic to update our DB will go into up function, and if we want to revert migration for some reason in case something went wrong then logic for rollback will go into down function. example of how those functions look:

```js
module.exports = {
  up: (queryInterface, Sequelize) => {},
  down: (queryInterface, Sequelize) => {},
};
```

In order to complete our task which is renaming our columns we are going to use `queryInterface` argument, you can consult sequelize documentation for all possible actions that you can perform with it, example for our task:

```js
// In up function,
// renameColumn is a Promise and up returns a promise so we need to do return

return Promise.all([
    queryInterface.renameColumn('students', 'testScore1', 'quizScore1'),
    queryInterface.renameColumn('students', 'testScore2', 'quizScore2'),
    queryInterface.renameColumn('students', 'testScore3', 'quizScore3'),
])

// In down function

return Promise.all([
    queryInterface.renameColumn('students', 'quizScore1', 'testScore1')
    queryInterface.renameColumn('students', 'quizScore2', 'testScore2')
    queryInterface.renameColumn('students', 'quizScore3', 'testScore3')
])
```

Now to run migration file that we just implemented we need to do `sequelize db:migrate`, and to undo migration we do `sequelize db:migrate:undo`

## Advanced migration (changing DataType)

Now what if we want to change our three columns into one column called quizScores which is of ARRAY type (unique to postgress)

First change model

```js
sequelize.define("student", {
  quizScores: DataTypes.ARRAY(DataTypes.INTEGERS),
});
```

Then run `sequelize migration:generate --name quizScores`

In quizScores migration file:

```js
up: (queryInteface, Sequelize) => {
  return queryInterface
    .addColumn("students", "quizScores", {
      type: Sequelize.ARRAY(Sequelize.INTEGERS),
    })
    .then(() => {
      return queryInteface.seqeuelize.query(`
        update students set 
        "quizScores"[0] = "quizScore1",
        "quizScores"[1] = "quizScore2",
        "quizScores"[2] = "quizScore3"
      `);
    })
    .then(() => {
      return Promise.all([
        queryInteface.removeColumn("students", "quizScore1"),
        queryInteface.removeColumn("students", "quizScore2"),
        queryInteface.removeColumn("students", "quizScore3"),
      ]);
    });
};
```

Finnally run `sequelize db:migrate`

Thing about migration is once you run it you can't spam run it again, it will say everything up to date. In that case you have two choices you can create new migration all over again or delete from `SequelizeMeta` which is not recommended because once you do it and run `db:migrate` you are going to run first migration as well.
