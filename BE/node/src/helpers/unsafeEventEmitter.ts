import { EventEmitter } from "events";

/**
 * What events do we expect
 * What params those events have
 */
const userAuthEmitter = new EventEmitter();

/**
 * We dont know what to expect, event name is a string
 * Event might come with some params, we don't know which and of what type, here user is any.
 */
userAuthEmitter.on("login", (user) => {
  console.log(user);
});

/**
 * Now we are emiting login event, with number as only arg, but we expect user.
 */
userAuthEmitter.emit("login", 1);
