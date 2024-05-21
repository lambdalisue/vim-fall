if exists('g:loaded_fall_config')
  finish
endif
let g:loaded_fall_config = 1

const s:sep = has('win32') ? '\\' : '/'
const s:dir = has('nvim') ? stdpath('config') : $HOME .. s:sep .. '.vim'

let g:fall_config_path = get(
      \ g:,
      \ 'fall_config_path',
      \ join([s:dir, 'fall', 'config.yaml'], s:sep),
      \)
