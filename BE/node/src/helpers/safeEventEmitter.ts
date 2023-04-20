import { EventEmitter } from "./EventEmitter";

type User = {
  id: string;
  name: string;
};

type EventMap = {
  login: [user: User];
  logout: [];
};

const userAuthEmitter = new EventEmitter<EventMap>();

userAuthEmitter.on("login", (user) => {
  console.log(user);
});

userAuthEmitter.emit("login", { id: "1", name: "John" });
