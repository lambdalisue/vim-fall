if exists('g:loaded_fall')
  finish
endif
let g:loaded_fall = 1

command! -nargs=*
      \ -complete=customlist,fall#command#Fall#complete
      \ Fall call fall#command#Fall#call([<f-args>])

command! -nargs=0
      \ FallRestore call fall#command#FallRestore#call()

command! -nargs=*
      \ -complete=customlist,fall#command#FallConfig#complete
      \ FallConfig call fall#command#FallConfig#call([<f-args>])

augroup fall
  autocmd!
  autocmd VimResized * call denops#notify('fall', 'event:dispatch', ["vim-resized"])
augroup END
