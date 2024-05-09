function! fall#extension#register(defs) abort
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'extension:register', [a:defs]) },
        \)
endfunction
