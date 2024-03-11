if exists('g:loaded_fall_builtin')
  finish
endif
let g:loaded_fall_builtin = 1

let s:sep = has('win32') ? '\' : '/'
let s:root = fnamemodify(resolve(expand('<sfile>:p')), ':h:h:h')

function! s:edit() abort
  let l:amatch = expand('<amatch>')
  let l:pathname = substitute(l:amatch, '^fallbuiltin://', '', '')
  let l:filename = join([s:root, 'denops', '@fall-builtin'] + split(l:pathname, '/'), s:sep)
  execute 'silent! keepalt keepjumps edit ' .. fnameescape(l:filename)
  execute 'silent! bwipeout! ' .. fnameescape(l:amatch)
endfunction

augroup fall_builtin
  autocmd!
  autocmd BufReadCmd fallbuiltin://* ++nested call s:edit()
augroup END
