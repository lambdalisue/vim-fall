# 🍂 fall

[![Test](https://github.com/vim-fall/fall/actions/workflows/test.yml/badge.svg)](https://github.com/vim-fall/fall/actions/workflows/test.yml)
[![Deno](https://img.shields.io/badge/Deno%202.x-333?logo=deno&logoColor=fff)](#)
[![codecov](https://codecov.io/gh/vim-fall/fall/graph/badge.svg?token=k2ZTes7Kln)](https://codecov.io/gh/vim-fall/fall)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![vim help](https://img.shields.io/badge/vim-%3Ah%20fall-orange.svg)](doc/fall.txt)

<div align="center">

![Screencast](https://github.com/lambdalisue/vim-fall/assets/546312/fca60054-73db-4bb1-82de-1262f1542862)

</div>

Fall is a fuzzy finder for Vim and Neovim, implemented in [Denops], and stands
for "Filter All."

> [!NOTE]
>
> Beta version. Please be aware that there might be backward incompatible
> changes.

[Denops]: https://github.com/vim-denops/denops.vim

## Requirements

Users must install [Deno] version 2.x. Additionally, the `nerdfont` renderer is
enabled by default so configure your terminal to use a [NerdFont] or disable it
by removing `builtin.renderer.nerdfont` renderer from the configuration
(`:FallConfig`).

[Deno]: https://deno.land
[NerdFont]: https://www.nerdfonts.com

Note that Deno version 1.x. is not tested and supported.

## Installation

To install [Denops] and this plugin using your preferred plugin manager, such as
[vim-plug], add the following lines to your Vim configuration:

```vim
Plug 'vim-denops/denops.vim'
Plug 'vim-fall/fall'
```

[vim-plug]: https://github.com/junegunn/vim-plug

## Usage

Use `:Fall` command to open the fuzzy finder. The command accepts the following
arguments:

```
Fall {source} {source_args}...
```

For example, if you'd like to use `file` source, you can use the following

```
Fall file
```

Or `line` source with `README.md` as an argument

```
Fall line README.md
```

## Configuration

Use `:FallConfig` command to open the configuration file. The configuration file
is written in TypeScript. The configuration is reloaded automatically when the
file is saved.

```
FallConfig
```

The following is a minimum configuration example. It only defines several
fundamental pickers as default configurations.

```typescript
import { type Entrypoint } from "jsr:@vim-fall/std@^0.4.0";
import * as builtin from "jsr:@vim-fall/std@^0.4.0/builtin";

export const main: Entrypoint = ({
  defineItemPickerFromSource,
  defineItemPickerFromCurator,
}) => {
  defineItemPickerFromCurator("git-grep", builtin.curator.gitGrep, {
    previewers: [builtin.previewer.file],
    actions: {
      ...builtin.action.defaultOpenActions,
      ...builtin.action.defaultSystemopenActions,
      ...builtin.action.defaultQuickfixActions,
    },
    defaultAction: "open",
  });

  defineItemPickerFromSource("file", builtin.source.file, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.file],
    actions: {
      ...builtin.action.defaultOpenActions,
      ...builtin.action.defaultSystemopenActions,
      ...builtin.action.defaultQuickfixActions,
    },
    defaultAction: "open",
  });

  defineItemPickerFromSource("line", builtin.source.line, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.buffer],
    actions: {
      ...builtin.action.defaultOpenActions,
      ...builtin.action.defaultBufferActions,
      ...builtin.action.defaultQuickfixActions,
    },
    defaultAction: "open",
  });

  defineItemPickerFromSource("buffer", builtin.source.buffer, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.buffer],
    actions: {
      ...builtin.action.defaultOpenActions,
      ...builtin.action.defaultBufferActions,
      ...builtin.action.defaultQuickfixActions,
    },
    defaultAction: "open",
  });

  defineItemPickerFromSource("help", builtin.source.helptag, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.helptag],
    actions: {
      ...builtin.action.defaultHelpActions,
    },
    defaultAction: "help",
  });
};
```

See
[`./denops/fall/_assets/default.config.ts`](./denops/fall/_assets/default.config.ts)
for the full code of the default configuration.

## Related Projects

| Repository                                                    | Package                                             | Description                                      |
| ------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| [vim-fall/fall-core](https://github.com/vim-fall/fall-core)   | [`@vim-fall/core`](https://jsr.io/@vim-fall/core)   | Core types for Fall. Not meant for external use. |
| [vim-fall/fall-std](https://github.com/vim-fall/fall-std)     | [`@vim-fall/std`](https://jsr.io/@vim-fall/std)     | Standard library for using Fall.                 |
| [vim-fall/fall-extra](https://github.com/vim-fall/fall-extra) | [`@vim-fall/extra`](https://jsr.io/@vim-fall/extra) | Extra library for using Fall.                    |

## Similar Projects

- [ddu.vim](https://github.com/Shougo/ddu.vim)<br>A highly customizable and
  extensible fuzzy finder for Vim/Neovim written in Denops.
- [telescope.nvim](https://github.com/nvim-telescope/telescope.nvim)<br>The de
  facto standard fuzzy finder for Neovim.
- [ctrlp.vim](https://github.com/ctrlpvim/ctrlp.vim)<br>A classic and famous
  fuzzy finder for Vim.

## License

The code in this repository follows the MIT license, as detailed in
[LICENSE](./LICENSE). Contributors must agree that any modifications submitted
to this repository also adhere to the license.
