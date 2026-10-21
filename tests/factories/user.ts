import { prismaFactorio } from "./factorio";

export const userFactory = prismaFactorio.define("user", {
  definition: ({ uid }) => ({ email: `user-${uid}@example.com` }),
});
