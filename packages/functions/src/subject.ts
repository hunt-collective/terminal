import { createSubjects } from "@openauthjs/core";
import { object, string } from "valibot";

export const subjects = createSubjects({
  user: object({
    userID: string(),
  }),
});
