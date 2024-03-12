if exists('g:loaded_fall')
  finish
endif
let g:loaded_fall = 1

command! -nargs=*
      \ -complete=customlist,fall#command#Fall#complete
      \ Fall call fall#command#Fall#call(<q-args>)

command! -nargs=*
      \ -complete=customlist,fall#command#FallConfig#complete
      \ FallConfig call fall#command#FallConfig#call(<q-args>)

augroup fall_plugin
  autocmd!
  autocmd BufReadCmd fallbuiltin://* ++nested 
        \ call fall#internal#builtin#edit(expand('<amatch>'))
augroup END
