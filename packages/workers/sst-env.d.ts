/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */
import "sst"
export {}
import "sst"
declare module "sst" {
  export interface Resource {
    "AirtableSecret": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "Api": {
      "type": "sst.aws.Router"
      "url": string
    }
    "ApiFn": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
    }
    "Auth": {
      "type": "sst.aws.Auth"
      "url": string
    }
    "AuthFingerprintKey": {
      "type": "random.index/randomString.RandomString"
      "value": string
    }
    "Bus": {
      "arn": string
      "name": string
      "type": "sst.aws.Bus"
    }
    "Database": {
      "database": string
      "host": string
      "password": string
      "port": number
      "type": "sst.sst.Linkable"
      "username": string
    }
    "Email": {
      "configSet": string
      "sender": string
      "type": "sst.aws.Email"
    }
    "EmailOctopusSecret": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "Forge": {
      "service": string
      "type": "sst.aws.Service"
    }
    "ForgeKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "GithubClientID": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "GithubClientSecret": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "IntervalBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "SSH": {
      "service": string
      "type": "sst.aws.Service"
      "url": string
    }
    "SSHKey": {
      "private": string
      "public": string
      "type": "tls.index/privateKey.PrivateKey"
    }
    "ShippoSecret": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "ShortDomainEmail": {
      "configSet": string
      "sender": string
      "type": "sst.aws.Email"
    }
    "Site": {
      "type": "sst.aws.Astro"
      "url": string
    }
    "SlackWebhook": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "StripePublic": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "StripeSecret": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "StripeWebhook": {
      "id": string
      "type": "stripe.index/webhookEndpoint.WebhookEndpoint"
    }
    "TwitchClientID": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "TwitchClientSecret": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "Vpc": {
      "type": "sst.aws.Vpc"
    }
  }
}
