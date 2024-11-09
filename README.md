# 🍂 fall

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![vim help](https://img.shields.io/badge/vim-%3Ah%20fall-orange.svg)](doc/fall.txt)

<div align="center">

![Screencast](https://github.com/lambdalisue/vim-fall/assets/546312/fca60054-73db-4bb1-82de-1262f1542862)

</div>

Fall is an abbreviation for "Filter All," another fuzzy finder designed for Vim
and Neovim and implemented in [Denops].

**Alpha version. Please note that any changes, including those that may be
backward incompatible, will be implemented without prior announcements.**

[Denops]: https://github.com/vim-denops/denops.vim

## Requirements

Users must install [Deno].

[Deno]: https://deno.land

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
