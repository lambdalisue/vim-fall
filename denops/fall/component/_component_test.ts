import type { Denops } from "jsr:@denops/std@^7.3.0";
import { test } from "jsr:@denops/test@^3.0.4";
import * as fn from "jsr:@denops/std@^7.3.0/function";
import { assertEquals, assertNotEquals } from "jsr:@std/assert@^1.0.7";

import { SINGLE_BORDER } from "../../@fall/builtin/theme/single.ts";
import { DOUBLE_BORDER } from "../../@fall/builtin/theme/double.ts";
import { screentext } from "./_testutil.ts";
import { BaseComponent } from "./_component.ts";

class TestComponent extends BaseComponent {
  render(
    _denops: Denops,
    _option?: { signal?: AbortSignal },
  ): Promise<true | void> {
    return Promise.resolve(true);
  }
}

const dimension = {
  col: 1,
  row: 1,
  width: 5,
  height: 5,
};

test(
  "all",
  "Component",
  async (denops, t) => {
    await t.step(
      "info is `undefined` if the component is not opened",
      async () => {
        await using component = new TestComponent({ dimension });
        assertEquals(component.info, undefined);
      },
    );

    await t.step("info is a value if the component is opened", async () => {
      await using component = new TestComponent({ dimension });
      await component.open(denops);
      assertNotEquals(component.info, undefined);
    });
  },
);

test("nvim", "Component", async (denops, t) => {
  await t.step("open opens the component window", async () => {
    await using component = new TestComponent({
      dimension: {
        col: 1,
        row: 1,
        width: 5,
        height: 5,
      },
      border: SINGLE_BORDER,
    });
    await component.open(denops);
    await denops.cmd("redraw");

    const info = component.info!;
    const wininfo = (await fn.getwininfo(denops, info.winid))[0] as {
      wincol: number;
      winrow: number;
      width: number;
      height: number;
    };
    const { wincol, winrow, width, height } = wininfo;

    const content = await screentext(
      denops,
      winrow,
      wincol,
      width + 2,
      height + 2,
    );
    assertEquals(winrow, 2); // +1 for border
    assertEquals(wincol, 2); // +1 for border
    assertEquals(width, 5);
    assertEquals(height, 5);
    assertEquals(content, [
      "┌─────┐",
      "│     │",
      "│~    │",
      "│~    │",
      "│~    │",
      "│~    │",
      "└─────┘",
    ]);
  });

  await t.step(
    "open does nothing if the component window is already opened",
    async () => {
      await using component = new TestComponent({
        dimension: {
          col: 1,
          row: 1,
          width: 5,
          height: 5,
        },
        border: SINGLE_BORDER,
      });
      await component.open(denops);
      await component.open(denops);
    },
  );

  await t.step(
    "move moves the component window",
    async () => {
      await using component = new TestComponent({
        dimension: {
          col: 1,
          row: 1,
          width: 5,
          height: 5,
        },
        border: SINGLE_BORDER,
      });
      await component.open(denops);
      await component.move(denops, {
        col: 10,
        row: 10,
        width: 10,
        height: 10,
      });
      await denops.cmd("redraw");

      const info = component.info!;
      const wininfo = (await fn.getwininfo(denops, info.winid))[0] as {
        wincol: number;
        winrow: number;
        width: number;
        height: number;
      };
      const { wincol, winrow, width, height } = wininfo;

      const content = await screentext(
        denops,
        winrow,
        wincol,
        width + 2,
        height + 2,
      );
      assertEquals(winrow, 11); // +1 for border
      assertEquals(wincol, 11); // +1 for border
      assertEquals(width, 10);
      assertEquals(height, 10);
      assertEquals(content, [
        "┌──────────┐",
        "│          │",
        "│~         │",
        "│~         │",
        "│~         │",
        "│~         │",
        "│~         │",
        "│~         │",
        "│~         │",
        "│~         │",
        "│~         │",
        "└──────────┘",
      ]);
    },
  );

  await t.step(
    "move does nothing if the component window is not opened",
    async () => {
      await using component = new TestComponent({
        dimension: {
          col: 1,
          row: 1,
          width: 5,
          height: 5,
        },
        border: SINGLE_BORDER,
      });
      await component.move(denops, {
        col: 10,
        row: 10,
        width: 10,
        height: 10,
      });
    },
  );

  await t.step(
    "update updates the component window",
    async () => {
      await using component = new TestComponent({
        dimension: {
          col: 1,
          row: 1,
          width: 5,
          height: 5,
        },
        border: SINGLE_BORDER,
      });
      await component.open(denops);
      await component.update(denops, {
        title: "Test",
        border: DOUBLE_BORDER,
      });
      await denops.cmd("redraw");

      const info = component.info!;
      const wininfo = (await fn.getwininfo(denops, info.winid))[0] as {
        wincol: number;
        winrow: number;
        width: number;
        height: number;
      };
      const { wincol, winrow, width, height } = wininfo;

      const content = await screentext(
        denops,
        winrow,
        wincol,
        width + 2,
        height + 2,
      );
      assertEquals(winrow, 2); // +1 for border
      assertEquals(wincol, 2); // +1 for border
      assertEquals(width, 5);
      assertEquals(height, 5);
      assertEquals(content, [
        "╔Test═╗",
        "║     ║",
        "║~    ║",
        "║~    ║",
        "║~    ║",
        "║~    ║",
        "╚═════╝",
      ]);
    },
  );

  await t.step(
    "update does nothing if the component window is not opened",
    async () => {
      await using component = new TestComponent({
        dimension: {
          col: 1,
          row: 1,
          width: 5,
          height: 5,
        },
        border: SINGLE_BORDER,
      });
      await component.update(denops, {
        title: "Test",
        border: DOUBLE_BORDER,
      });
    },
  );

  await t.step("close closes the component window", async () => {
    await using component = new TestComponent({
      dimension: {
        col: 1,
        row: 1,
        width: 5,
        height: 5,
      },
      border: SINGLE_BORDER,
    });
    await component.open(denops);
    await denops.cmd("redraw");

    const info = component.info!;
    const wininfo = (await fn.getwininfo(denops, info.winid))[0] as {
      wincol: number;
      winrow: number;
      width: number;
      height: number;
    };
    const { wincol, winrow, width, height } = wininfo;

    await component.close();
    await denops.cmd("redraw");
    const content = await screentext(
      denops,
      winrow,
      wincol,
      width + 2,
      height + 2,
    );
    assertEquals(winrow, 2); // +1 for border
    assertEquals(wincol, 2); // +1 for border
    assertEquals(width, 5);
    assertEquals(height, 5);
    assertEquals(content, [
      "       ",
      "       ",
      "       ",
      "       ",
      "       ",
      "       ",
      "       ",
    ]);
  });
});
