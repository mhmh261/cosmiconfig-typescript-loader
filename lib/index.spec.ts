import path from "node:path";
import { cosmiconfig, cosmiconfigSync } from "cosmiconfig";
import { describe, expect, it } from "vitest";
import { TypeScriptLoader } from ".";

describe("TypeScriptLoader", () => {
  const fixturesPath = path.resolve(__dirname, "__fixtures__");

  describe("exports", () => {
    it("should export the loader function as a default", () => {
      expect(typeof TypeScriptLoader).toStrictEqual("function");
    });
  });

  describe("cosmiconfig", () => {
    it("should load a valid TS file", async () => {
      const cfg = cosmiconfig("test", {
        loaders: {
          ".ts": TypeScriptLoader(),
        },
      });
      const loadedCfg = await cfg.load(
        path.resolve(fixturesPath, "valid.fixture.ts")
      );

      expect(typeof loadedCfg!.config).toStrictEqual("object");
      expect(typeof loadedCfg!.config.test).toStrictEqual("object");
      expect(loadedCfg!.config.test.cake).toStrictEqual("a lie");
    });

    it("should throw an error on loading an invalid TS file", async () => {
      const cfg = cosmiconfig("test", {
        loaders: {
          ".ts": TypeScriptLoader(),
        },
      });

      try {
        await cfg.load(path.resolve(fixturesPath, "invalid.fixture.ts"));
        throw new Error("Should fail to load invalid TS");
      } catch (error: any) {
        expect(error?.name).toStrictEqual("TypeScriptCompileError");
      }
    });
  });

  describe("cosmiconfigSync", () => {
    it("should load a valid TS file", () => {
      const cfg = cosmiconfigSync("test", {
        loaders: {
          ".ts": TypeScriptLoader(),
        },
      });
      const loadedCfg = cfg.load(
        path.resolve(fixturesPath, "valid.fixture.ts")
      );

      expect(typeof loadedCfg!.config).toStrictEqual("object");
      expect(typeof loadedCfg!.config.test).toStrictEqual("object");
      expect(loadedCfg!.config.test.cake).toStrictEqual("a lie");
    });

    it("should throw an error on loading an invalid TS file", () => {
      const cfg = cosmiconfigSync("test", {
        loaders: {
          ".ts": TypeScriptLoader(),
        },
      });

      expect(() =>
        cfg.load(path.resolve(fixturesPath, "invalid.fixture.ts"))
      ).toThrowError();
    });
  });
});
