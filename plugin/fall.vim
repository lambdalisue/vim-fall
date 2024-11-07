if exists('g:loaded_fall')
  finish
endif
let g:loaded_fall = 1

command! -nargs=+ Fall call fall#command#Fall#call([<f-args>])
command! -nargs=0 FallConfig call fall#command#FallConfig#call()

augroup fall_plugin
  autocmd! *
  autocmd User FallPickerEnter:* :
  autocmd User FallPickerLeave:* :
  autocmd VimResized * call fall#internal#dispatch(#{type: 'vim-resized', width: &columns, height: &lines})
augroup END

let g:fall_config_path = '~/.config/fall/config.ts'
