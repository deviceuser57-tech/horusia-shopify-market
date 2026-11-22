import assert from "node:assert/strict";
import { oauthReturnPath } from "../src/lib/oauth-return-path";

assert.equal(oauthReturnPath("/shop?search=papyrus#featured"), "/shop?search=papyrus#featured");
assert.equal(oauthReturnPath("https://outside.example/path"), "/");
assert.equal(oauthReturnPath("//outside.example/path"), "/");
assert.equal(oauthReturnPath("/\\outside.example/path"), "/");
assert.equal(oauthReturnPath("/shop\nmalformed"), "/");

console.log("OAuth return path checks passed.");