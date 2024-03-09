if exists('g:loaded_fall')
  finish
endif
let g:loaded_fall = 1

command! -nargs=* Fall call fall#command(<q-args>)
