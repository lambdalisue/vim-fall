function! fall#command#FallRestore#call() abort
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'picker:restore', []) },
        \)
endfunction
