/** Models of accounts, users, user profiles and account contacts, as `/api/v1/accounts/` returns them. */

import { z } from "zod";

import { SmarterAccountRef, SmarterResource } from "./base.ts";

/** A Smarter account: the tenant that owns users and resources. */
export const Account = SmarterResource.extend({
  accountNumber: z.string(),
  isDefaultAccount: z.boolean().nullish(),
  companyName: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  address1: z.string().nullish(),
  address2: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  postalCode: z.string().nullish(),
  country: z.string().nullish(),
  language: z.string().nullish(),
  timezone: z.string().nullish(),
  currency: z.string().nullish(),
  isActive: z.boolean().nullish(),
});
export type Account = z.infer<typeof Account>;

/** A user of the platform. */
export const User = z.looseObject({
  id: z.number().int(),
  username: z.string(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().nullish(),
  isStaff: z.boolean().nullish(),
  isSuperuser: z.boolean().nullish(),
});
export type User = z.infer<typeof User>;

/** A user's membership of an account, which owns the resources that the user creates in it. */
export const UserProfile = SmarterResource.extend({
  user: User,
  account: SmarterAccountRef,
  /** The url of the image that the user uploaded, which takes precedence over `profileImageUrl`. */
  profileImage: z.string().nullish(),
  /** The url of the image that the oauth provider supplied. */
  profileImageUrl: z.string().nullish(),
  isTest: z.boolean().nullish(),
});
export type UserProfile = z.infer<typeof UserProfile>;

/** A contact of an account, who receives its notices. */
export const AccountContact = z.looseObject({
  id: z.number().int(),
  account: SmarterAccountRef.nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  isPrimary: z.boolean().nullish(),
  isTest: z.boolean().nullish(),
  welcomed: z.boolean().nullish(),
});
export type AccountContact = z.infer<typeof AccountContact>;
