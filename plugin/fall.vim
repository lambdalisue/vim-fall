if exists('g:loaded_fall')
  finish
endif
let g:loaded_fall = 1

command! -nargs=*
      \ -complete=customlist,fall#command#Fall#complete
      \ Fall call fall#command#Fall#call(<q-args>)

command! -nargs=0
      \ FallRestore call fall#command#FallRestore#call()

command! -nargs=1
      \ -complete=customlist,fall#command#FallConfig#complete
      \ FallConfig call fall#command#FallConfig#call(<q-args>)

augroup fall
  autocmd!
  autocmd VimResized * call denops#notify('fall', 'event:dispatch', ["vim-resized"])
augroup END
