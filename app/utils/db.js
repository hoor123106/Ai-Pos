import Dexie from "dexie";

export const authDb = new Dexie("AuthDB");
authDb.version(2).stores({
  users: "email",
  user_session: "id"
});