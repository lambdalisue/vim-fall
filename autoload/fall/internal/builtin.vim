let s:sep = has('win32') ? '\' : '/'
let s:root = fnamemodify(resolve(expand('<sfile>:p')), ':h:h:h:h')

function! fall#internal#builtin#edit(expr) abort
  let l:pathname = substitute(a:expr, '^fallbuiltin://', '', '')
  let l:filename = join([s:root, 'denops', '@fall-builtin'] + split(l:pathname, '/'), s:sep)
  execute 'silent! keepalt keepjumps edit ' .. fnameescape(l:filename)
  execute 'silent! bwipeout! ' .. fnameescape(a:expr)
endfunction

