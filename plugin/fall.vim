if exists('g:loaded_fall')
  finish
endif
let g:loaded_fall = 1
let s:sep = has('win32') ? '\' : '/'

command! -nargs=+ -complete=customlist,fall#command#Fall#complete 
      \ Fall call fall#command#Fall#call([<f-args>])

command! -nargs=0 FallConfig call fall#command#FallConfig#call()
command! -nargs=0 FallConfigReload call fall#command#FallConfigReload#call()
command! -nargs=0 FallConfigRecache call fall#command#FallConfigRecache#call()

augroup fall_plugin
  autocmd! *
  autocmd User FallPickerEnter:* :
  autocmd User FallPickerLeave:* :
augroup END

if !exists('g:fall_config_path')
  let g:fall_config_path = has('nvim')
        \ ? join([stdpath('config'), 'fall', 'config.ts'], s:sep)
        \ : join([$HOME, '.vim', 'fall', 'config.ts'], s:sep)
endif
