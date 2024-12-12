import { ActorContext } from "@terminal/core/actor";
import { Api } from "@terminal/core/api/api";
import { User } from "@terminal/core/user/index";

// prompt for email
const email = prompt("Enter email");
if (!email) throw new Error("Email is required");

const user = await User.fromEmail(email);
if (user.length !== 1) new Error("User not found or multiple users found");

ActorContext.with(
  {
    type: "user",
    properties: {
      userID: user[0]!.id,
    },
  },
  async () => {
    console.log(
      await Api.create({
        name: "Raycast",
        redirectURI: "https://raycast.com/redirect",
      }),
    );
  },
);
