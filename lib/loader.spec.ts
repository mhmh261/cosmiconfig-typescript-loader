import fs from "node:fs";
import path from "node:path";
import { Loader } from "cosmiconfig";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  SpyInstance,
  vi,
} from "vitest";
import * as tsnode from "ts-node";

import { TypeScriptLoader } from "./loader";
import { TypeScriptCompileError } from "./typescript-compile-error";

vi.mock("ts-node", async () => {
  const actualTsnode = await vi.importActual<typeof import("ts-node")>(
    "ts-node"
  );

  const writableTsNode: any = {};
  Object.keys(actualTsnode).forEach((key) =>
    Object.defineProperty(writableTsNode, key, {
      value: (actualTsnode as any)[key],
      writable: true,
    })
  );

  return writableTsNode;
});

describe("TypeScriptLoader", () => {
  const fixturesPath = path.resolve(__dirname, "__fixtures__");
  const tsNodeSpy = vi.spyOn(tsnode, "register");

  let loader: Loader;

  function readFixtureContent(file: string): string {
    return fs.readFileSync(file).toString();
  }

  beforeAll(() => {
    loader = TypeScriptLoader();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should parse a valid TS file", () => {
    const filePath = path.resolve(fixturesPath, "valid.fixture.ts");
    loader(filePath, readFixtureContent(filePath));
  });

  it("should fail on parsing an invalid TS file", () => {
    const filePath = path.resolve(fixturesPath, "invalid.fixture.ts");
    expect(() => loader(filePath, readFixtureContent(filePath))).toThrowError();
  });

  it("should use the same instance of ts-node across multiple calls", () => {
    const filePath = path.resolve(fixturesPath, "valid.fixture.ts");
    loader(filePath, readFixtureContent(filePath));
    loader(filePath, readFixtureContent(filePath));
    expect(tsNodeSpy).toHaveBeenCalledTimes(1);
  });

  it("should throw a TypeScriptCompileError on error", () => {
    try {
      const filePath = path.resolve(fixturesPath, "invalid.fixture.ts");
      loader(filePath, readFixtureContent(filePath));
      throw new Error(
        "Error should be thrown upon failing to transpile an invalid TS file."
      );
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TypeScriptCompileError);
    }
  });

  describe("ts-node", () => {
    const unknownError = "Test Error";

    let stub: SpyInstance<[service: tsnode.Service], tsnode.Service>;

    beforeEach(() => {
      stub = vi.spyOn(tsnode, "register").mockImplementation(
        () =>
          ({
            compile: (): string => {
              // eslint-disable-next-line @typescript-eslint/no-throw-literal
              throw unknownError;
            },
          } as any)
      );
      loader = TypeScriptLoader();
    });

    afterEach(() => {
      stub.mockRestore();
    });

    it("rethrows an error if it is not an instance of Error", () => {
      try {
        loader("filePath", "readFixtureContent(filePath)");
        throw new Error(
          "Error should be thrown upon failing to transpile an invalid TS file."
        );
      } catch (error: unknown) {
        expect(error).not.toBeInstanceOf(TypeScriptCompileError);
        expect(error).toStrictEqual(unknownError);
      }
    });
  });
});
