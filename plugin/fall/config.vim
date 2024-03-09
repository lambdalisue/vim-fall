if exists('g:loaded_fall_config')
  finish
endif
let g:loaded_fall_config = 1

const s:sep = has('win32') ? '\\' : '/'
const s:dir = has('nvim') ? stdpath('config') : $HOME .. s:sep .. '.vim'

augroup fall_config
  autocmd!
  autocmd User DenopsPluginPost:fall call denops#request('fall', 'reloadConfig', ['picker'])
  autocmd User DenopsPluginPost:fall call denops#request('fall', 'reloadConfig', ['extension'])
augroup END

let g:fall_picker_config_path = get(
      \ g:,
      \ 'fall_picker_config_path',
      \ s:dir .. s:sep .. 'fall-picker.json',
      \)
let g:fall_extension_config_path = get(
      \ g:,
      \ 'fall_extension_config_path',
      \ s:dir .. s:sep .. 'fall-extension.json',
      \)
