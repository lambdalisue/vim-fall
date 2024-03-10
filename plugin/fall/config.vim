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
  autocmd User DenopsPluginPost:fall call denops#request('fall', 'reloadConfig', ['registry'])
augroup END

let g:fall_picker_config_path = get(
      \ g:,
      \ 'fall_picker_config_path',
      \ join([s:dir, 'vim-fall', 'picker-config.json'], s:sep),
      \)
let g:fall_extension_config_path = get(
      \ g:,
      \ 'fall_extension_config_path',
      \ join([s:dir, 'vim-fall', 'extension-config.json'], s:sep),
      \)
let g:fall_registry_config_path = get(
      \ g:,
      \ 'fall_registry_config_path',
      \ join([s:dir, 'vim-fall', 'registry-config.json'], s:sep),
      \)
