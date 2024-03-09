if exists('g:loaded_fall')
  finish
endif
let g:loaded_fall = 1

command! -nargs=*
      \ -complete=customlist,fall#command#Fall#complete
      \ Fall call fall#command#Fall#call(<q-args>)
