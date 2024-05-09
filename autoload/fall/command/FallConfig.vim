function! fall#command#FallConfig#call() abort
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'config:edit', []) },
        \)
endfunction

function! fall#command#FallConfig#complete(arglead, cmdline, cursorpos) abort
  return []
endfunction
