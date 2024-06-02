# 🍂 fall

[![Test](https://github.com/lambdalisue/vim-fall/actions/workflows/test.yml/badge.svg)](https://github.com/lambdalisue/vim-fall/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/lambdalisue/vim-fall/graph/badge.svg?token=IsZ3yEM1by)](https://codecov.io/gh/lambdalisue/vim-fall)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![vim help](https://img.shields.io/badge/vim-%3Ah%20fall-orange.svg)](doc/fall.txt)

<div align="center">

![Screencast](https://private-user-images.githubusercontent.com/546312/335872453-4e0b5de1-f4c2-40d4-a188-d972ba6c3fef.gif?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MTczMzgwMjUsIm5iZiI6MTcxNzMzNzcyNSwicGF0aCI6Ii81NDYzMTIvMzM1ODcyNDUzLTRlMGI1ZGUxLWY0YzItNDBkNC1hMTg4LWQ5NzJiYTZjM2ZlZi5naWY_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQwNjAyJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MDYwMlQxNDE1MjVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03N2QzZDFjMmI0ZTYyZDM1MDExMzFlOTNjNWMzOWM1ODg0ZmE0NDQ5NzM3MmJjNmEwZDU3NjE1ZjZhM2VmMzBiJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZhY3Rvcl9pZD0wJmtleV9pZD0wJnJlcG9faWQ9MCJ9.2rLo11QdMw4D51DIwtmiYYV5SuLq97sltLzo3cJDrkc)

</div>

Fall (_vim-fall_) is an abbreviation for "Filter All," another fuzzy finder
designed for Vim and Neovim and implemented in [Denops].

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
Plug 'lambdalisue/vim-fall'
```

[vim-plug]: https://github.com/junegunn/vim-plug

## Usage

Use `:Fall` command to open the fuzzy finder. The command accepts the following
arguments:

```
:Fall {source} {source_args}...
```

For example, if you'd like to use `file` source, you can use the following

```
:Fall file
```

Or `line` source with `README.md` as an argument

```
:Fall line README.md
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
