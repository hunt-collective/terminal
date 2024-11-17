import { z } from "@hono/zod-openapi";
import { Address } from "@terminal/core/address";
import { User } from "@terminal/core/user/index";

export module Schema {
  export const AddressSchema = z.object(Address.shape).openapi("Address");
  export const UserSchema = z.object(User.Info.shape).openapi("User");
  export const UserShippingSchema = z
    .object(User.Shipping.shape)
    .extend({ address: AddressSchema })
    .openapi("UserShipping");
}
