#!/usr/bin/env bun

import { Resource } from "sst";
import { spawnSync } from "bun";

spawnSync(
  [
    "mysql",
    "-h",
    Resource.Database.host,
    "-u",
    Resource.Database.username,
    "--password=" + Resource.Database.password,
    Resource.Database.database,
  ],
  {
    stdout: "inherit",
    stdin: "inherit",
    stderr: "inherit",
  },
);
