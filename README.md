# 🍂 Fall

[![Test](https://github.com/vim-fall/fall.vim/actions/workflows/test.yml/badge.svg)](https://github.com/vim-fall/fall.vim/actions/workflows/test.yml)
[![Deno](https://img.shields.io/badge/Deno%202.x-333?logo=deno&logoColor=fff)](#)
[![codecov](https://codecov.io/gh/vim-fall/fall.vim/graph/badge.svg?token=k2ZTes7Kln)](https://codecov.io/gh/vim-fall/fall.vim)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vim Help](https://img.shields.io/badge/vim-%3Ah%20fall-orange.svg)](doc/fall.txt)

<div align="center">

![CleanShot 2024-11-17 at 15 17 46](https://github.com/user-attachments/assets/f19fe70e-1b6f-4493-90da-45fcfdd5cd57)<br>
<sup>Fall with [vim-glyph-pallet](https://github.com/lambdalisue/vim-glyph-palette) (Colors on glyphs) on [NordFox](https://github.com/EdenEast/nightfox.nvim) (Vim's colorscheme)</sup>
</div>

Fall is a fuzzy finder for Vim and Neovim, implemented in [Denops], and stands
for **"Filter All."**

> [!WARNING]
>
> This is a beta version. Please be aware that there might be
> backward-incompatible changes.

[Denops]: https://github.com/vim-denops/denops.vim

## Requirements

Users must install [Deno] version 2.x. Additionally, the `nerdfont` renderer is
enabled by default, so configure your terminal to use a [NerdFont], or disable
it by removing the `builtin.renderer.nerdfont` renderer from the configuration
(`:FallConfig`).

[Deno]: https://deno.land
[NerdFont]: https://www.nerdfonts.com

Note that Deno version 1.x is not tested and not supported.

## Installation

To install [Denops] and this plugin using your preferred plugin manager, such as
[vim-plug], add the following lines to your Vim configuration:

```vim
Plug 'vim-denops/denops.vim'
Plug 'vim-fall/fall.vim'
```

[vim-plug]: https://github.com/junegunn/vim-plug

## Usage

Use the `:Fall` command to open the fuzzy finder. The command accepts the
following arguments:

```
Fall {source} {source_args}...
```

For example, if you'd like to use the `file` source, you can use the following:

```
Fall file
```

Or use the `line` source with `README.md` as an argument:

```
Fall line README.md
```

## Key Mappings

> [!NOTE]
>
> You can confirm your actual key mappings by opening the help window (`<F1>`).

| Key Mapping    | Description                                                         | Plug Mapping                                |
| :------------- | :------------------------------------------------------------------ | :------------------------------------------ |
| `<C-t>`        | Move the cursor of the list component to the first item             | `<Plug>(fall-list-first)`                   |
| `<C-g>`        | Move the cursor of the list component to the last item              | `<Plug>(fall-list-last)`                    |
| `<C-p>`        | Move the cursor of the list component to the previous item          | `<Plug>(fall-list-prev)`                    |
| `<C-n>`        | Move the cursor of the list component to the next item              | `<Plug>(fall-list-next)`                    |
| `<C-u>`        | Move the cursor of the list component up by `&scroll`               | `<Plug>(fall-list-prev:scroll)`             |
| `<C-d>`        | Move the cursor of the list component down by `&scroll`             | `<Plug>(fall-list-next:scroll)`             |
| `<PageUp>`     | Move the content of the list component to the left                  | `<Plug>(fall-list-left)`                    |
| `<PageDown>`   | Move the content of the list component to the right                 | `<Plug>(fall-list-right)`                   |
| `<S-PageUp>`   | Move the content of the list component to the left by `&scroll`     | `<Plug>(fall-list-left:scroll)`             |
| `<S-PageDown>` | Move the content of the list component to the right by `&scroll`    | `<Plug>(fall-list-right:scroll)`            |
| `<C-,>`        | Select the current item in the list component                       | `<Plug>(fall-select)`                       |
| `<C-.>`        | Select all items in the list component                              | `<Plug>(fall-select-all)`                   |
| `<C-j>`        | Select and move the cursor to the next item                         | `<Plug>(fall-select)<Plug>(fall-list-next)` |
| `<C-k>`        | Move the cursor to the previous item and select it                  | `<Plug>(fall-list-prev)<Plug>(fall-select)` |
| `<M-Home>`     | Move the cursor of the preview component to the first line          | `<Plug>(fall-preview-first)`                |
| `<M-End>`      | Move the cursor of the preview component to the last line           | `<Plug>(fall-preview-last)`                 |
| `<M-Up>`       | Move the cursor of the preview component to the previous line       | `<Plug>(fall-preview-prev)`                 |
| `<M-Down>`     | Move the cursor of the preview component to the next line           | `<Plug>(fall-preview-next)`                 |
| `<S-Up>`       | Move the cursor of the preview component up by `&scroll`            | `<Plug>(fall-preview-prev:scroll)`          |
| `<S-Down>`     | Move the cursor of the preview component down by `&scroll`          | `<Plug>(fall-preview-next:scroll)`          |
| `<M-Left>`     | Move the content of the preview component to the left               | `<Plug>(fall-preview-left)`                 |
| `<M-Right>`    | Move the content of the preview component to the right              | `<Plug>(fall-preview-right)`                |
| `<S-Left>`     | Move the content of the preview component to the left by `&scroll`  | `<Plug>(fall-preview-left:scroll)`          |
| `<S-Right>`    | Move the content of the preview component to the right by `&scroll` | `<Plug>(fall-preview-right:scroll)`         |
| `<Tab>`        | Open an action selector to execute an action                        | `<Plug>(fall-action-select)`                |
| `<F1>`         | Open or close the help window                                       | `<Plug>(fall-help)`                         |
| `<S-Home>`     | Go to the previous page in the help window                          | `<Plug>(fall-help-prev)`                    |
| `<S-End>`      | Go to the next page in the help window                              | `<Plug>(fall-help-next)`                    |
| `<F2>`         | Switch to the next matcher in the current picker                    | `<Plug>(fall-switch-matcher-next)`          |
| `<F3>`         | Switch to the next sorter in the current picker                     | `<Plug>(fall-switch-sorter-next)`           |
| `<F4>`         | Switch to the next renderer in the current picker                   | `<Plug>(fall-switch-renderer-next)`         |
| `<F5>`         | Switch to the next previewer in the current picker                  | `<Plug>(fall-switch-previewer-next)`        |

### Customization

Use `FallPickerEnter:*` autocmd to customize mappings in the picker window.

```vim
function! s:fall_mappings() abort
  " Use <Up> and <Down> to move the cursor in the list component instead of <C-p> and <C-n>
  cnoremap <silent> <Up> <Plug>(fall-list-prev)
  cnoremap <silent> <Down> <Plug>(fall-list-next)
  " Disable horizontal scrolling
  cnoremap <silent> <Nop> <Plug>(fall-list-left)
  cnoremap <silent> <Nop> <Plug>(fall-list-right)
endfunction

augroup my_fall_mapping
  autocmd!
  autocmd User FallPickerEnter:* call s:fall_mappings()
augroup END
```

If you want to invoke an action with a key mapping, you can use the
`fall#action()` function.

```vim
function! s:fall_mappings() abort
  cnoremap <silent> <C-e> <Cmd>call fall#action('open')<CR>
  cnoremap <silent> <C-x> <Cmd>call fall#action('open:split')<CR>
  cnoremap <silent> <C-v> <Cmd>call fall#action('open:vsplit')<CR>
  cnoremap <silent> <C-t> <Cmd>call fall#action('open:tabedit')<CR>
endfunction

augroup my_fall_mapping
  autocmd!
  autocmd User FallPickerEnter:* call s:fall_mappings()
augroup END
```

If you want to apply mappings to a particular picker, you can specify the picker
name in the `FallPickerEnter:{name}` autocmd.

```vim
" These mappings are only available on the "file" picker.
function! s:fall_mappings_file() abort
  cnoremap <silent> <C-e> <Cmd>call fall#action('open')<CR>
  cnoremap <silent> <C-x> <Cmd>call fall#action('open:split')<CR>
  cnoremap <silent> <C-v> <Cmd>call fall#action('open:vsplit')<CR>
  cnoremap <silent> <C-t> <Cmd>call fall#action('open:tabedit')<CR>
endfunction

augroup my_fall_mapping
  autocmd!
  autocmd User FallPickerEnter:file call s:fall_mappings_file()
augroup END
```

If you want to completely disable the default key mappings, use the
`g:fall_disable_default_mappings` variable.

```vim
let g:fall_disable_default_mappings = v:true
```

## Configuration

Use the `:FallConfig` command to open the configuration file. The configuration
file is written in TypeScript and is reloaded automatically when the file is
saved.

```
FallConfig
```

The following is a minimal configuration example. It defines two pickers.

```typescript
import { type Entrypoint } from "jsr:@vim-fall/config@^0.17.3";
import * as builtin from "jsr:@vim-fall/std@^0.6.0/builtin";

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
};
```

See
[`./denops/fall/_assets/default.config.ts`](./denops/fall/_assets/default.config.ts)
for the full code of the default configuration.

## Related Projects

| Repository                                                                | Package                                               | Description                                      |
| ------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| [vim-fall/deno-fall-core](https://github.com/vim-fall/deno-fall-core)     | [`@vim-fall/core`](https://jsr.io/@vim-fall/core)     | Core types for Fall. Not meant for external use. |
| [vim-fall/deno-fall-config](https://github.com/vim-fall/deno-fall-config) | [`@vim-fall/config`](https://jsr.io/@vim-fall/config) | Module to configure Fall.                        |
| [vim-fall/deno-fall-std](https://github.com/vim-fall/deno-fall-std)       | [`@vim-fall/std`](https://jsr.io/@vim-fall/std)       | Standard library for using Fall.                 |
| [vim-fall/deno-fall-extra](https://github.com/vim-fall/deno-fall-extra)   | [`@vim-fall/extra`](https://jsr.io/@vim-fall/extra)   | Extra library for using Fall.                    |

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
