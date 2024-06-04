function! fall#command#Fall#call(args) abort
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'picker:start', [a:args]) },
        \)
endfunction

function! fall#command#Fall#complete(arglead, cmdline, cursorpos) abort
  return denops#request('fall', 'extension:complete', [a:arglead, a:cmdline, a:cursorpos])
endfunction
