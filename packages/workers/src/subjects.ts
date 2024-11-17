import { createSubjects } from "@openauthjs/core";
import { email, object, pipe, string } from "valibot";

export const subjects = createSubjects({
  user: object({
    email: pipe(string(), email()),
  }),
});
