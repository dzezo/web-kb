### What is Microservice

#### Monolithic server

**Definition:** All of the code needed to implement our application is inside one single codebase and we deploy that code base as one single unit.

**Differences**
Monolith contains: Routing, Middlewares, Business Logic & Database access to implement **entire** aplication whereas Microservice has all these components but for a **single** feature within application.

#### Microservice architecture

Entire app is divided into services that perform completely unrelated tasks and are independent of one another. Those services can even have their own DBs.
Advantage of such approach is that app can still function even if some services fail.

#### Data in Microservices

Managing data between services is the biggest challenge when it comes to microservices.

One way in which we can overcome this is issue is to implement design pattern called Database-Per-Service. DPS pattern is used for a couple of reasons:

1. **We want each service to run independently of other services:**
   To ensure this we need to assign database to each services (if that services needs DB to begin with), and we need to prevent services from ever reaching into another services database, because this will cause dependency in case of failiure.
2. **Database schema/structure might change unexpectedly**
   Team that works on **service#2** can for example change name of some property without informing team that works on **service#1**. In such case **service#2** which is not configured to handle new property name will fail because of this.
3. **Some services might function more efficently with different types of DB's (sql vs nosql)**

#### Communication Strategies Between Services

There are to strategies for communications: **Sync and Async**
These words don't mean what they mean in the JS world.

**Sync**: Services communicate with each other using direct requests.

- Pros:
  1. Easy to understand
  2. Additional service might not need DB
- Cons:
  1. Introduces a dependecy between services
  2. If any inter-service request fails the overall request fails
  3. The entire request is only as fast as slowest request
  4. Can easily introduce nested dependencies

**Async**: Services communicate with each other using events.
General idea is to introduce **Event Bus** that is accessible to every other service. Job of this Event Bus is to handle notifications from different services.
Events are small objects, example:

```js
const event = {
  type: UserQuery,
  data: {
    id: number,
  },
};
```

Lets say that we have 4 services, **service#4** is newly added service that needs to communicate with other 3 inorder to complete its task. To accomplish this **service#4** emits an event to read from **service#1**, **service#1** acknowledges this event fullfils it and responds with event of its own, **service#4** grabs this new event from event bus and issues another request to **service#2** and so on so forth.

This way of communication is not as easy to understand as **Sync**, and furthermore it doesn't even solve issues that come with Sync way of communication.

So this form of **Async** communication will not be used very often (but it exists).

There is another way to handle async communication and that is to have DB for this new **service#4** and whenever something happens in other services that service emits an event to event bus, **service#4** will then pick up relevant events and populate its DB.

- Pros:
  1. Service has zero dependencies
  2. Service will be extremely fast
- Cons:
  1. Data duplication.
  2. Harder to understand

#### Database Management

If we delete or restart the pod running MongoDB for example, we will lose all of the data in it!

#### Authentication in microservices

Authentication in microservices is an unsolved problem, there are many ways to do it, and no one way is right.

There are two general strategies to approach auth in microservices, and they are many more variations of these strategies.

##### Fundamental Option #1

Individual services rely on the centralized auth service.

For example in scenario where request with JWT, cookie or something else is issued to some service, that service will than send **sync request** to auth service.
After auth status is decided it is then up to auth service to send request back service who called it.

- Pros: Changes to auth state are immediately reflected
- Cons: Auth service goes down? Entire app is broken

##### Fundamental Option #1.1

Individual services rely on the auth service as a gateway.

This is a variation of previous option, difference is that request goes to auth service immediately instead of first going to desired service.

##### Fundamental Option #2

Individual services know how to authenticate a user.

Every services needs to contain authentication logic. In this scenario we don't have outside dependencies since everything is wrapped up inside a single service.

Downside of this solution is that JWT, cookie or whatever else that comes with request can be still valid, even tho something changed in auth service to prevents user from accessing certain services, and since services are decoupled from auth service they wouldn't know about this new information.

- Pros: Auth service is down? Who cares!
- Cons: Some user got banned? Darn, I just gave them keys to my car 5 mins ago.

#### Cookies vs JWT's

1. Cookies
   1.1 Transport mechanism (doesn't have to be auth related)
   1.2 Moves any kind of data between browser and server
   1.3 Automatically managed by the browser

2. JWT's
   2.1 Authentication/Authorization mechanism
   2.2 Stores any data we want
   2.3 We have to manage it manually

#### Microservices Auth Requirements

- Must be able to tell us details about a user
- Must be able to handle authorization info
- Must have a built-in, tamper-resistant way to expire or invalidate itself
- Must be easily understood between different languages
  - Cookie handling across languages is usually an issue when we encrypt the data in the cookie (You can if it's a big deal)
  - We will not encrypt the cookie contents, since JWT's are tamper resistant
- Must not require some kind of backing data store on the server

#### JWT's in SSR

For SPA react app there are two requests from users before content is displayed

1. Fetch root HTML file
2. Fetch JS file to work with root shell

After this we usually make auth request followed by content request.

With SSR react app content is delivered with the very first request, which presents an issue. That issue is solved by using **Cookie** as transport mechanism for our JWT.

#### Testing in Microservices

1. Test a single piece of code in isolation
   **Example**: Single middleware
2. Test how different pieces of code work together
   **Example**: Request flowing through multiple middlewares to a request handler
3. Test how different components work together
   **Example**: Make request to service, ensure write to database was completed
4. Test how different services work together
   **Example**: Creating a _payment_ at the _payments service_ should affect the _orders service_
   **Challenge**: This is very difficult to achive in microservices environment, we need to think of ways to construct some kind of environment quickly and cost effectively to test it. Should we spin a test k8s cluster and launch payments and orders service inside of it, how do we issue request to these things and how to assert results to these things.

##### Testing Goals

1. Basic request handling
   1.1. Start in-memory copy of MongoDB
   1.2. Start up our express app
   1.3. Use supertest lib to make fake requests to our express app
   1.4. Run assertions to make sure that request did the right thing
2. Some tests around models
3. Event emitting and receiving
